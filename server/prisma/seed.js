import { PrismaClient } from "@prisma/client";
import { addDays, addHours, set } from "date-fns";
const prisma = new PrismaClient();
async function main() {
    await prisma.meeting.deleteMany();
    await prisma.availabilityOverride.deleteMany();
    await prisma.availabilityDay.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.eventType.deleteMany();
    await prisma.user.deleteMany();
    const user = await prisma.user.create({
        data: {
            name: "Yajat Gupta",
            email: "yajat@example.com",
            timezone: "Asia/Kolkata",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
        }
    });
    const [coffeeChat, productDemo, interview] = await Promise.all([
        prisma.eventType.create({
            data: {
                userId: user.id,
                name: "30 Minute Intro Call",
                slug: "intro-call",
                duration: 30,
                description: "A focused introduction call to discuss goals, scope, and next steps."
            }
        }),
        prisma.eventType.create({
            data: {
                userId: user.id,
                name: "45 Minute Product Demo",
                slug: "product-demo",
                duration: 45,
                description: "Walkthrough of the product, use cases, and implementation questions."
            }
        }),
        prisma.eventType.create({
            data: {
                userId: user.id,
                name: "60 Minute Technical Interview",
                slug: "technical-interview",
                duration: 60,
                description: "Deep-dive conversation covering architecture, tradeoffs, and code quality."
            }
        })
    ]);
    const availability = await prisma.availability.create({
        data: {
            userId: user.id,
            timezone: "Asia/Kolkata",
            weeklyDays: {
                create: [
                    { dayOfWeek: 1, isEnabled: true, startTime: "09:00", endTime: "17:00" },
                    { dayOfWeek: 2, isEnabled: true, startTime: "09:00", endTime: "17:00" },
                    { dayOfWeek: 3, isEnabled: true, startTime: "09:00", endTime: "17:00" },
                    { dayOfWeek: 4, isEnabled: true, startTime: "09:00", endTime: "17:00" },
                    { dayOfWeek: 5, isEnabled: true, startTime: "09:00", endTime: "16:00" },
                    { dayOfWeek: 6, isEnabled: false, startTime: "09:00", endTime: "17:00" },
                    { dayOfWeek: 0, isEnabled: false, startTime: "09:00", endTime: "17:00" }
                ]
            }
        }
    });
    await prisma.availabilityOverride.create({
        data: {
            availabilityId: availability.id,
            date: set(addDays(new Date(), 2), {
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            }),
            isEnabled: true,
            startTime: "11:00",
            endTime: "15:00"
        }
    });
    const upcomingStart = addHours(addDays(new Date(), 1), 4);
    const pastStart = addHours(addDays(new Date(), -3), 2);
    await Promise.all([
        prisma.meeting.create({
            data: {
                userId: user.id,
                eventTypeId: productDemo.id,
                inviteeName: "Aarav Sharma",
                inviteeEmail: "aarav@example.com",
                startTime: upcomingStart,
                endTime: addHours(upcomingStart, 1),
                timezone: "Asia/Kolkata"
            }
        }),
        prisma.meeting.create({
            data: {
                userId: user.id,
                eventTypeId: coffeeChat.id,
                inviteeName: "Sara Wilson",
                inviteeEmail: "sara@example.com",
                startTime: pastStart,
                endTime: addHours(pastStart, 1),
                timezone: "America/New_York"
            }
        }),
        prisma.meeting.create({
            data: {
                userId: user.id,
                eventTypeId: interview.id,
                inviteeName: "Nina Patel",
                inviteeEmail: "nina@example.com",
                startTime: addHours(addDays(new Date(), 6), 3),
                endTime: addHours(addHours(addDays(new Date(), 6), 3), 1),
                timezone: "Europe/London"
            }
        })
    ]);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
