import { NextRequest, NextResponse } from 'next/server';
import { fileSearchTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

// Initialize the agent with your configuration
const fileSearch = fileSearchTool([
  "vs_6955295efbc4819192a74440dde236ef"
]);

const vaillAgent = new Agent({
  name: "VAILL Reports Assistant",
  instructions: "When I type a question to this agent, I want you to search your vector store throughout the entire [Vaill Updates to Chris] collection to best answer the question from the user",
  model: "gpt-4o",
  tools: [fileSearch],
  modelSettings: {
    store: true
  }
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build conversation history
    const history: AgentInputItem[] = [
      ...conversationHistory,
      { role: "user", content: [{ type: "input_text", text: message }] }
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_695526bbca008190b2f526af56447f4a01b4c7a295bab2e2"
      }
    });

    const result = await withTrace("vaill-reports-chat", async () => {
      return await runner.run(vaillAgent, history);
    });

    if (!result.finalOutput) {
      throw new Error("No response from agent");
    }

    return NextResponse.json({
      response: result.finalOutput,
      newItems: result.newItems.map((item) => item.rawItem)
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
