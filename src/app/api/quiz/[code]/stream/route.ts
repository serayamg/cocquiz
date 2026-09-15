import { NextRequest } from 'next/server';
import { quizHub } from '@/lib/quiz-hub';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const joinCode = params.code;
  const isHost = req.nextUrl.searchParams.get('role') === 'host';

  let sseController: ReadableStreamDefaultController | null = null;
  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      sseController = controller;
      quizHub.subscribe(joinCode, controller);

      // Send initial state immediately
      const initialState = await quizHub.getRoomState(joinCode, isHost);
      if (initialState) {
        const payload = `data: ${JSON.stringify({ type: 'INITIAL_STATE', state: initialState })}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      } else {
        const payload = `data: ${JSON.stringify({ type: 'ERROR', message: 'Room not found' })}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      }

      // Keepalive ping every 15 seconds
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
        }
      }, 15000);
    },
    cancel() {
      if (sseController) {
        quizHub.unsubscribe(joinCode, sseController);
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
