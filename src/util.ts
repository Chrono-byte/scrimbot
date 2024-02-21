import { PrismaClient } from "@prisma/client";

export const modes = {
  "control": {
    "antarctic": "Antarctica",
    "busan": "Busan",
    "ilios": "Ilios",
    "lijiang": "Lijiang Tower",
    "nepal": "Nepal",
    "oasis": "Oasis",
    "samoa": "Samoa",
  },
  "hybrid": {
    "blizzard": "Blizzard World",
    "eichenwalde": "Eichenwalde",
    "hollywood": "Hollywood",
    "kings": "King's Row",
    "midtown": "Midtown",
    "numbani": "Numbani",
    "paraiso": "Paraiso",
  },
  "flashpoint": {
    "newjunkcity": "New Junk City",
    "suravasa": "Suravasa",
  },
  "push": {
    "colosseo": "Colosseo",
    "esperanca": "Esperança",
    "toronto": "Toronto",
  },
  "escort": {
    "circuit": "Circuit Royale",
    "dorado": "Dorado",
    "havana": "Havana",
    "junkertown": "Junkertown",
    "rialto": "Rialto",
    "route": "Route 66",
    "shambali": "Shambali Monastery",
    "watchpoint": "Watchpoint: Gibraltar",
  },
};

export function modeNameToInt(mode: string) {
  switch (mode) {
    case "control":
      return 0;
    case "hybrid":
      return 1;
    case "flashpoint":
      return 2;
    case "push":
      return 3;
    case "escort":
      return 4;
  }
}

export function intToModeName(mode: number) {
  switch (mode) {
    case 0:
      return "control";
    case 1:
      return "hybrid";
    case 2:
      return "flashpoint";
    case 3:
      return "push";
    case 4:
      return "escort";
  }
}

const intervals = [
  { label: "year", seconds: 31536000 },
  { label: "month", seconds: 2592000 },
  { label: "day", seconds: 86400 },
  { label: "hour", seconds: 3600 },
  { label: "minute", seconds: 60 },
  { label: "second", seconds: 1 },
];

export const timeSince = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const interval = intervals.find((i) => i.seconds < seconds)!;
  const count = Math.floor(seconds / interval.seconds);
  return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
};

export const prisma = new PrismaClient().$extends({
  name: "memberEnsure",
  model: {
    member: {
      async ensure(guildId: string, userId: string) {
        return await prisma.member.upsert({
          where: {
            guildId_userId: {
              guildId,
              userId,
            },
          },
          create: {
            guild: {
              connectOrCreate: {
                where: {
                  id: guildId,
                },
                create: {
                  id: guildId,
                },
              },
            },
            user: {
              connectOrCreate: {
                where: {
                  id: userId,
                },
                create: {
                  id: userId,
                },
              },
            },
          },
          update: {},
        });
      },
    },
  },
});
