import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topicId, participantName, displayName } = await req.json();

    if (!topicId || !participantName) {
      return NextResponse.json({ error: 'topicId and participantName are required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || 'APIdqR5t6UDV58H';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'LZXd7gkGfSgZbyjeVgBfk9N6DPSE6qHYOuujsptur6HB';

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const roomName = `topic-${topicId}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: displayName || participantName,
      ttl: '2h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, roomName });
  } catch (err: any) {
    console.error('LiveKit token error:', err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
