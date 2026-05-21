import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } =
    new URL(req.url);

  const year =
    searchParams.get("year");

  const month =
    searchParams.get("month");

  const status =
    searchParams.get("status");

  const type =
    searchParams.get("type");

  const where: any = {};

  if (year) {
    where.year = Number(year);
  }

  if (month) {
    where.month = Number(month);
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.daire_type = type;
  }

  const dues =
    await prisma.dues.findMany({
      where,

      orderBy: [
        {
          year: "desc",
        },
        {
          month: "desc",
        },
        {
          daire_no: "asc",
        },
      ],
    });

  return Response.json({
    dues,
  });
}