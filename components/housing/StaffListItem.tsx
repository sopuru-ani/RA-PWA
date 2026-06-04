"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StaffListItem as StaffItem } from "@/types/admin";
import { roleLabelShort } from "@/lib/role-labels";

type Props = {
  staff: StaffItem;
  detailHref?: string;
};

function StaffListItem({ staff, detailHref }: Props) {
  const displayName = staff.fullName ?? staff.email;
  const statusLabel =
    staff.status === "pending"
      ? "Pending signup"
      : staff.status === "inactive"
        ? "Inactive"
        : "Active";

  return (
    <Card className="px-3 py-1 md:border-0 md:border-b md:shadow-none md:rounded-none">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="staff">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col md:flex-row md:items-center md:gap-x-4 gap-y-3 text-left w-full pr-2">
              <p className="font-medium leading-none">{displayName}</p>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary">{roleLabelShort(staff.role)}</Badge>
                <Badge
                  variant={
                    staff.status === "active" ? "default" : "outline"
                  }
                  className={staff.status === "active" ? "text-white" : ""}
                >
                  {statusLabel}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 text-sm">
            <div>
              <span className="font-medium">Email:</span> {staff.email}
            </div>
            {staff.communities.length > 0 ? (
              <div>
                <span className="font-medium">Communities:</span>{" "}
                {staff.communities.join(", ")}
              </div>
            ) : null}
            {staff.assignments.length > 0 ? (
              <div>
                <span className="font-medium">Assignment:</span>{" "}
                {staff.assignments.join(", ")}
              </div>
            ) : null}
            {detailHref ? (
              <Link
                href={detailHref}
                className="text-primary text-sm underline-offset-4 hover:underline w-fit"
              >
                View details
              </Link>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export default StaffListItem;
