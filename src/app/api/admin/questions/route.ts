import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const topic = searchParams.get('topic') || '';
    const status = searchParams.get('status') || ''; // 'active' or 'inactive'

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { questionText: { contains: search } },
        { topic: { contains: search } },
        { explanation: { contains: search } },
      ];
    }

    if (difficulty && difficulty !== 'ALL') {
      whereClause.difficulty = difficulty;
    }

    if (topic && topic !== 'ALL') {
      whereClause.topic = topic;
    }

    if (status === 'active') {
      whereClause.active = true;
    } else if (status === 'inactive') {
      whereClause.active = false;
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        options: {
          orderBy: { optionKey: 'asc' },
        },
        questionBank: true,
      },
      orderBy: [
        { questionNumber: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const banks = await prisma.questionBank.findMany();
    const allTopics = await prisma.question.findMany({
      select: { topic: true },
      distinct: ['topic'],
    });

    return NextResponse.json({
      questions,
      banks,
      topics: allTopics.map((t) => t.topic),
    });
  } catch (error: any) {
    console.error('Error getting questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionBankId,
      topic,
      difficulty,
      questionText,
      explanation,
      options, // Array of { key: 'A', text: '...', correct: true/false }
      active = true,
    } = body;

    if (!topic || !questionText || !explanation || !options || options.length < 2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let bankId = questionBankId;
    if (!bankId) {
      const defaultBank = await prisma.questionBank.findFirst();
      if (!defaultBank) {
        const newBank = await prisma.questionBank.create({
          data: {
            title: 'General Question Bank',
            category: 'General',
          },
        });
        bankId = newBank.id;
      } else {
        bankId = defaultBank.id;
      }
    }

    const question = await prisma.question.create({
      data: {
        questionBankId: bankId,
        topic,
        difficulty: difficulty || 'LOW',
        questionText,
        explanation,
        active: Boolean(active),
        options: {
          create: options.map((opt: any) => ({
            optionKey: opt.key,
            optionText: opt.text,
            isCorrect: Boolean(opt.correct),
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      topic,
      difficulty,
      questionText,
      explanation,
      active,
      options,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (topic !== undefined) updateData.topic = topic;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (questionText !== undefined) updateData.questionText = questionText;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (active !== undefined) updateData.active = Boolean(active);

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete old options and recreate
      await prisma.answerOption.deleteMany({
        where: { questionId: id },
      });

      await prisma.answerOption.createMany({
        data: options.map((opt: any) => ({
          questionId: id,
          optionKey: opt.key,
          optionText: opt.text,
          isCorrect: Boolean(opt.correct),
        })),
      });
    }

    const updated = await prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
