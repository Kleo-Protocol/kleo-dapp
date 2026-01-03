import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

async function getUserFromRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error fetching profile', { error: err.message }, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, surname, walletAddress } = body as {
      name: string;
      surname: string;
      walletAddress?: string | null;
    };

    if (!name || !surname) {
      return NextResponse.json({ error: 'Name and surname are required' }, { status: 400 });
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        name,
        surname,
        walletAddress: walletAddress ?? null,
        email: user.email!,
      },
      create: {
        userId: user.id,
        name,
        surname,
        walletAddress: walletAddress ?? null,
        email: user.email!,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating/updating profile', { error: err.message }, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, surname, walletAddress } = body as {
      name?: string;
      surname?: string;
      walletAddress?: string | null;
    };

    const profile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        ...(name && { name }),
        ...(surname && { surname }),
        ...(walletAddress !== undefined && { walletAddress: walletAddress ?? null }),
        email: user.email!,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating profile', { error: err.message }, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}