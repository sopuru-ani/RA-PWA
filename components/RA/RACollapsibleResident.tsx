import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

import type { ResidentLean } from "@/db/resident.model";

interface Props {
  resident: ResidentLean;
  raSection: string;
}

function RACollapsibleResident({ resident, raSection }: Props) {
  return (
    <Card
      className={`px-3 py-1 md:border-0 md:border-b md:shadow-none md:rounded-none`}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col md:flex-row md:items-center md:gap-x-6 gap-y-1 text-left">
              <p className="font-medium leading-none md:w-100">
                {resident.fullName}
              </p>
              <p className="text-sm text-muted-foreground md:w-fit">
                {`${resident.section} · Room ${resident.room}`}
              </p>
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
            <div>
              <span className="font-medium">Notes:</span> {resident.notes}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* <CardContent className="hidden lg:flex items-center gap-x-6">
        <p className="font-medium leading-none shrink-0">David Chapel</p>
        <p className="text-sm text-muted-foreground shrink-0">
          Student Apartment 3 · Room 2401
        </p>
        <p className="shrink-0">
          <span className="font-medium">Email:</span> davidchapel@umes.edu
        </p>
        <p className="shrink-0">
          <span className="font-medium">Student ID:</span> 1334869
        </p>
        <p className="shrink-0 truncate">
          <span className="font-medium">Notes:</span> He's an ok guy I think
        </p>
      </CardContent> */}
    </Card>
  );
}

export default RACollapsibleResident;
