"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";

function RACollapsibleResident() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return (
    <Card className="px-3 py-1 w-full">
      <Accordion type="single" collapsible className="w-full md:block">
        <AccordionItem value="item-1">
          {/* Accordion trigger for mobile */}
          <AccordionTrigger className="hover:no-underline flex flex-col items-start gap-1 text-left md:hidden">
            <p className="font-medium leading-none">David Chapel</p>
            <p className="text-sm text-muted-foreground">
              Student Apartment 3 · Room 2401
            </p>
          </AccordionTrigger>

          {/* Desktop static row */}
          <div className="hidden md:flex flex-row flex-wrap items-center gap-6 text-sm">
            <span className="font-medium whitespace-nowrap">David Chapel</span>
            <span className="text-muted-foreground whitespace-nowrap">
              Student Apartment 3 · Room 2401
            </span>
            <span className="text-muted-foreground whitespace-nowrap">
              davidchapel@umes.edu
            </span>
            <span className="text-muted-foreground whitespace-nowrap">
              ID: 1334869
            </span>
          </div>

          {/* Notes */}
          <AccordionContent className="flex flex-col gap-2 text-sm md:mt-1">
            <div className="line-clamp-2 md:line-clamp-none">
              <span className="font-medium">Notes:</span> He's an ok guy I think
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export default RACollapsibleResident;
