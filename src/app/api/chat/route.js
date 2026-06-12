import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { decryptServerText } from '@/lib/crypto-server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orgId,
      query,
      context,
      history = [],
      stream: requestStreaming = false
    } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Missing user query.' }, { status: 400 });
    }

    // Load LLM configuration from settings database directly using orgId
    const masterDb = await getDb('local');
    const settings = await masterDb.get('SELECT * FROM settings WHERE org_id = ?', orgId);

    if (!settings || !settings.encrypted_llm_key) {
      return NextResponse.json({ error: 'LLM private API key is required but not configured. Set it in Settings.' }, { status: 400 });
    }

    let activeKey;
    try {
      activeKey = decryptServerText(settings.encrypted_llm_key);
    } catch (cryptoErr) {
      return NextResponse.json({ error: 'Failed to decrypt LLM API configuration on the server.' }, { status: 500 });
    }

    const activeProvider = settings.llm_provider || 'openai';
    const activeModel = settings.active_model;

    if (!activeKey) {
      return NextResponse.json({ error: 'LLM API Private Key is empty or invalid. Set it in Settings.' }, { status: 400 });
    }

    // Define standard System Prompt
    const systemPrompt = `You are a helpful and professional corporate policy bot. 

If the user greets you (e.g., "hello", "hi", "hey", "good morning") or asks about your identity / capabilities, reply with a warm, professional greeting and explain that your purpose is to help employees securely query and understand the company's guidelines, HR policies, and employee handbook.

For all other questions, your sole task is to answer the employee's query using ONLY the provided guideline context sections. 
If the answer cannot be found in the context, politely state that you could not find this information in the official guidelines and suggest contacting HR or the appropriate department. Do not make up facts or extrapolate beyond the context.

Formatting Guidelines:
- Structure your response cleanly using Markdown headers (###), bullet points, or numbered lists for readability.
- Use **bold text** to highlight critical figures, limits, conditions, deadlines, or key terms.
- Quote or reference specific guidelines directly in *italics*.
- Present rules and steps in organized lists.

At the end of your answer, cite the source section(s) used in the format:
📄 Source: *[Section Name]*

Context:
${context || 'No specific document context found.'}`;

    // Helper to generate a ReadableStream for server-sent text chunks
    const createProviderStream = async (providerUrl, fetchOptions) => {
      return new ReadableStream({
        async start(controller) {
          const textEncoder = new TextEncoder();
          try {
            const providerRes = await fetch(providerUrl, fetchOptions);
            if (!providerRes.ok) {
              const errText = await providerRes.text();
              controller.enqueue(textEncoder.encode(`Error from provider: ${errText}`));
              controller.close();
              return;
            }

            const reader = providerRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop(); // Keep incomplete line in buffer

              for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;

                if (cleanLine.startsWith('data: ')) {
                  const dataStr = cleanLine.slice(6).trim();
                  if (dataStr === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(dataStr);
                    let text = '';

                    if (activeProvider === 'openai' || activeProvider === 'openrouter') {
                      text = parsed.choices?.[0]?.delta?.content || '';
                    } else if (activeProvider === 'anthropic') {
                      text = parsed.delta?.text || '';
                    }

                    if (text) {
                      controller.enqueue(textEncoder.encode(text));
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for incomplete lines or other SSE comments
                  }
                }
              }
            }
            controller.close();
          } catch (err) {
            controller.enqueue(textEncoder.encode(`Stream error: ${err.message}`));
            controller.close();
          }
        }
      });
    };

    // 2. OpenAI Integration
    if (activeProvider === 'openai') {
      const model = activeModel || 'gpt-4o-mini';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: query }
      ];

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_tokens: 2048,
          stream: requestStreaming
        })
      };

      if (requestStreaming) {
        const stream = await createProviderStream('https://api.openai.com/v1/chat/completions', fetchOptions);
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } else {
        const res = await fetch('https://api.openai.com/v1/chat/completions', fetchOptions);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenAI API returned error: ${errText}`);
        }
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (!reply) throw new Error(`OpenAI returned an unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
        return NextResponse.json({ reply });
      }
    }

    // 3. Anthropic Integration
    if (activeProvider === 'anthropic') {
      const model = activeModel || 'claude-3-5-haiku-20241022';
      const messages = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query }
      ];

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': activeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages,
          max_tokens: 1024,
          temperature: 0.1,
          stream: requestStreaming
        })
      };

      if (requestStreaming) {
        const stream = await createProviderStream('https://api.anthropic.com/v1/messages', fetchOptions);
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } else {
        const res = await fetch('https://api.anthropic.com/v1/messages', fetchOptions);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Anthropic API returned error: ${errText}`);
        }
        const data = await res.json();
        const reply = data?.content?.[0]?.text;
        if (!reply) throw new Error(`Anthropic returned an unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
        return NextResponse.json({ reply });
      }
    }

    // 4. OpenRouter Integration
    if (activeProvider === 'openrouter') {
      const model = activeModel || 'google/gemini-2.5-flash';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: query }
      ];

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
          'HTTP-Referer': 'https://hush-rag.local',
          'X-Title': 'HushRag Bot'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_tokens: 2048,
          stream: requestStreaming
        })
      };

      if (requestStreaming) {
        const stream = await createProviderStream('https://openrouter.ai/api/v1/chat/completions', fetchOptions);
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', fetchOptions);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenRouter API returned error: ${errText}`);
        }
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (!reply) throw new Error(`OpenRouter returned an unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
        return NextResponse.json({ reply });
      }
    }

    throw new Error(`Unsupported LLM provider: ${activeProvider}`);
  } catch (e) {
    console.error('LLM proxy router error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
