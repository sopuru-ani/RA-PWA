"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import type { ResidentWithStaff } from "@/types/admin";

type Props = {
  resident: ResidentWithStaff;
  href?: string;
};

function ResidentListItem({ resident, href }: Props) {
  const detailHref = href ?? `/admin/residents/${resident._id}`;
  return (
    <Card className="px-3 py-1 md:border-0 md:border-b md:shadow-none md:rounded-none">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="resident">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col md:flex-row md:items-center md:gap-x-6 gap-y-1 text-left">
              <p className="font-medium leading-none md:w-100">{resident.fullName}</p>
              <div className="text-sm text-muted-foreground md:w-fit">
                <p>{resident.community}</p> {resident.section} · Room {resident.room}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 text-sm">
            <div>
              <span className="font-medium">Email:</span> {resident.email}
            </div>
            <div>
              <span className="font-medium">Student ID:</span>{" "}
              {resident.studentId}
            </div>
            {resident.raEmail ? (
              <div>
                <span className="font-medium">RA:</span> {resident.raEmail}
              </div>
            ) : null}
            <Link
              href={detailHref}
              className="text-primary underline-offset-4 hover:underline w-fit"
            >
              View details
            </Link>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export default ResidentListItem;
