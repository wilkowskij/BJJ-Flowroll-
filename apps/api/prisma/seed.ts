import { PrismaClient, BeltLevel, TechniquePosition, TechniqueType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── 1. Demo Gym ────────────────────────────────────────────────────────────
  const gym = await prisma.gym.upsert({
    where: { slug: 'gracie-north-demo' },
    update: {
      name: 'Gracie North Demo',
      primaryColor: '#1B4FD8',
      secondaryColor: '#F59E0B',
    },
    create: {
      name: 'Gracie North Demo',
      slug: 'gracie-north-demo',
      primaryColor: '#1B4FD8',
      secondaryColor: '#F59E0B',
    },
  });
  console.log(`Gym: ${gym.name} (${gym.id})`);

  // ─── 2. Users ───────────────────────────────────────────────────────────────
  const instructor = await prisma.user.upsert({
    where: { supabaseUid: 'demo-instructor-uid' },
    update: {
      name: 'Coach Alex',
      email: 'alex@gracienorth.demo',
      role: 'instructor',
      beltLevel: BeltLevel.black,
      gymId: gym.id,
    },
    create: {
      gymId: gym.id,
      supabaseUid: 'demo-instructor-uid',
      email: 'alex@gracienorth.demo',
      name: 'Coach Alex',
      role: 'instructor',
      beltLevel: BeltLevel.black,
    },
  });
  console.log(`Instructor: ${instructor.name} (${instructor.id})`);

  const student = await prisma.user.upsert({
    where: { supabaseUid: 'demo-student-uid' },
    update: {
      name: 'Sam Rodriguez',
      email: 'sam@example.com',
      role: 'student',
      beltLevel: BeltLevel.blue,
      gymId: gym.id,
    },
    create: {
      gymId: gym.id,
      supabaseUid: 'demo-student-uid',
      email: 'sam@example.com',
      name: 'Sam Rodriguez',
      role: 'student',
      beltLevel: BeltLevel.blue,
    },
  });
  console.log(`Student: ${student.name} (${student.id})`);

  // ─── 3. Techniques ──────────────────────────────────────────────────────────
  const techniqueData: Array<{
    title: string;
    position: TechniquePosition;
    beltLevel: BeltLevel;
    type: TechniqueType;
    difficulty: number;
    description?: string;
  }> = [
    {
      title: 'Armbar from Guard',
      position: TechniquePosition.guard,
      beltLevel: BeltLevel.white,
      type: TechniqueType.submission,
      difficulty: 2,
      description: 'Classic armbar executed from closed guard — hip extension locks the elbow.',
    },
    {
      title: 'Triangle Choke',
      position: TechniquePosition.guard,
      beltLevel: BeltLevel.blue,
      type: TechniqueType.submission,
      difficulty: 3,
      description: 'Figure-four leg choke from guard cutting off blood flow to the carotid arteries.',
    },
    {
      title: 'Hip Escape / Shrimp',
      position: TechniquePosition.guard,
      beltLevel: BeltLevel.white,
      type: TechniqueType.escape,
      difficulty: 1,
      description: 'Fundamental movement drill — creates space and recovers guard from bottom.',
    },
    {
      title: 'Double Leg Takedown',
      position: TechniquePosition.standing,
      beltLevel: BeltLevel.white,
      type: TechniqueType.takedown,
      difficulty: 2,
      description: 'Penetration step takedown securing both legs to bring opponent to the mat.',
    },
    {
      title: 'Guard Pass — Torreando',
      position: TechniquePosition.guard,
      beltLevel: BeltLevel.blue,
      type: TechniqueType.other,
      difficulty: 3,
      description: 'Bullfighter pass — control the pants and pivot around the legs to pass.',
    },
    {
      title: 'Mount Escape — Elbow-Knee',
      position: TechniquePosition.mount,
      beltLevel: BeltLevel.white,
      type: TechniqueType.escape,
      difficulty: 2,
      description: 'Bridge and roll or elbow-knee recovery to regain guard from under mount.',
    },
    {
      title: 'Back Take from Turtle',
      position: TechniquePosition.back,
      beltLevel: BeltLevel.blue,
      type: TechniqueType.transition,
      difficulty: 3,
      description: 'Seat-belt grip and hook insertion to take the back from a turtled opponent.',
    },
    {
      title: 'Rear Naked Choke',
      position: TechniquePosition.back,
      beltLevel: BeltLevel.blue,
      type: TechniqueType.submission,
      difficulty: 2,
      description: 'Rear naked choke (RNC) — arm across the throat compressing carotid arteries.',
    },
    {
      title: 'De La Riva Guard Entry',
      position: TechniquePosition.guard,
      beltLevel: BeltLevel.purple,
      type: TechniqueType.transition,
      difficulty: 4,
      description: 'DLR hook and collar grip to enter De La Riva guard and threaten sweeps.',
    },
    {
      title: 'Leg Drag Pass',
      position: TechniquePosition.guard,
      beltLevel: BeltLevel.purple,
      type: TechniqueType.other,
      difficulty: 4,
      description: 'Drag the leg across the body to clear guard and establish side control.',
    },
  ];

  const techniques: Record<string, string> = {};
  for (const t of techniqueData) {
    const technique = await prisma.technique.upsert({
      where: {
        // Techniques are unique by gymId + title — use a workaround via findFirst + create/update
        id: (
          (await prisma.technique.findFirst({ where: { gymId: gym.id, title: t.title } })) || { id: 'not-found' }
        ).id,
      },
      update: { ...t, gymId: gym.id },
      create: { ...t, gymId: gym.id },
    });
    techniques[t.title] = technique.id;
    console.log(`Technique: ${technique.title} (${technique.id})`);
  }

  // ─── 4. Flowchart (instructor) ───────────────────────────────────────────────
  const nodes = [
    { id: 'n1', type: 'technique', position: { x: 100, y: 100 }, data: { label: 'Armbar from Guard', techniqueId: techniques['Armbar from Guard'] } },
    { id: 'n2', type: 'technique', position: { x: 300, y: 100 }, data: { label: 'Triangle Choke', techniqueId: techniques['Triangle Choke'] } },
    { id: 'n3', type: 'technique', position: { x: 200, y: 250 }, data: { label: 'Hip Escape / Shrimp', techniqueId: techniques['Hip Escape / Shrimp'] } },
    { id: 'n4', type: 'technique', position: { x: 400, y: 250 }, data: { label: 'Rear Naked Choke', techniqueId: techniques['Rear Naked Choke'] } },
    { id: 'n5', type: 'technique', position: { x: 300, y: 400 }, data: { label: 'Guard Pass — Torreando', techniqueId: techniques['Guard Pass — Torreando'] } },
  ];

  const edges = [
    { id: 'e1', source: 'n1', target: 'n2', label: 'if blocked' },
    { id: 'e2', source: 'n2', target: 'n4', label: 'back take' },
    { id: 'e3', source: 'n3', target: 'n5', label: 'reset to pass' },
  ];

  await prisma.flowchart.upsert({
    where: { userId: instructor.id },
    update: {
      title: 'Guard Attacks Flowchart',
      nodes,
      edges,
    },
    create: {
      userId: instructor.id,
      gymId: gym.id,
      title: 'Guard Attacks Flowchart',
      nodes,
      edges,
    },
  });
  console.log('Flowchart created for instructor');

  // ─── 5. BeltTracks ───────────────────────────────────────────────────────────
  const beltTrackData: Array<{ beltLevel: BeltLevel; requiredClasses: number }> = [
    { beltLevel: BeltLevel.white, requiredClasses: 50 },
    { beltLevel: BeltLevel.blue, requiredClasses: 100 },
    { beltLevel: BeltLevel.purple, requiredClasses: 150 },
    { beltLevel: BeltLevel.brown, requiredClasses: 200 },
    { beltLevel: BeltLevel.black, requiredClasses: 300 },
  ];

  for (const bt of beltTrackData) {
    await prisma.beltTrack.upsert({
      where: { gymId_beltLevel: { gymId: gym.id, beltLevel: bt.beltLevel } },
      update: { requiredClasses: bt.requiredClasses },
      create: {
        gymId: gym.id,
        beltLevel: bt.beltLevel,
        requiredClasses: bt.requiredClasses,
        requiredTechniqueIds: [],
      },
    });
    console.log(`BeltTrack: ${bt.beltLevel} (${bt.requiredClasses} classes)`);
  }

  // ─── 6. WeeklyPosts ──────────────────────────────────────────────────────────
  const existingPublished = await prisma.weeklyPost.findFirst({
    where: { gymId: gym.id, title: 'Week 1: Guard Fundamentals' },
  });
  if (!existingPublished) {
    await prisma.weeklyPost.create({
      data: {
        gymId: gym.id,
        instructorId: instructor.id,
        title: 'Week 1: Guard Fundamentals',
        body: 'This week we are covering the essential guard attacks — armbar, triangle, and hip escape. Drill each technique 10 times on each side.',
        techniqueIds: [techniques['Armbar from Guard'], techniques['Triangle Choke'], techniques['Hip Escape / Shrimp']],
        beltTarget: BeltLevel.white,
        publishedAt: new Date(),
      },
    });
    console.log('WeeklyPost: Week 1 (published)');
  }

  const existingDraft = await prisma.weeklyPost.findFirst({
    where: { gymId: gym.id, title: 'Week 2: Back Attacks Preview' },
  });
  if (!existingDraft) {
    await prisma.weeklyPost.create({
      data: {
        gymId: gym.id,
        instructorId: instructor.id,
        title: 'Week 2: Back Attacks Preview',
        body: 'Coming up next week — back takes from turtle and the rear naked choke. Stay tuned!',
        techniqueIds: [techniques['Back Take from Turtle'], techniques['Rear Naked Choke']],
        beltTarget: BeltLevel.blue,
        publishedAt: null,
      },
    });
    console.log('WeeklyPost: Week 2 (draft)');
  }

  // ─── 7. Subscription ─────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { gymId: gym.id },
    update: {
      tier: 'starter',
      activeStudentCount: 1,
    },
    create: {
      gymId: gym.id,
      tier: 'starter',
      activeStudentCount: 1,
      billingPeriodStart: new Date(),
    },
  });
  console.log('Subscription: starter tier');

  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
