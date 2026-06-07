"use client";
import { Croissant } from "lucide-react";
import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ChevronsUpDown } from "lucide-react";
import { UserType } from "@/db/user.model";
import { RoomWithVacancy } from "@/db/room.model";
import { ResidentLean } from "@/db/resident.model";
import { formatUserAssignment } from "@/lib/formatters";
import { roleLabelLong } from "@/lib/role-labels";

type Props = {
  user: UserType;
  vacancies: RoomWithVacancy[];
  residents: ResidentLean[];
};

function RAHeader({ user, vacancies, residents }: Props) {
  const [collapsibleIsOpen, setCollapsibleIsOpen] = useState(true);
  const assignmentLabel = formatUserAssignment(
    user.assignment,
    user.community,
  );
  const section = user.assignment[0];

  return (
    <div className="relative">
      <Collapsible open={collapsibleIsOpen} onOpenChange={setCollapsibleIsOpen}>
        <CardContent className="space-y-1 py-2">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {roleLabelLong(user.role)}
              </p>
              <p className="text-lg font-semibold">
                <Croissant className="inline" />
                {` ${user.firstName} ${user.lastName}`}
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronsUpDown />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="">
            {assignmentLabel ? (
              <p className="text-sm text-muted-foreground">{assignmentLabel}</p>
            ) : null}
            <Separator className="my-1" />

            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {
                    residents.filter((resident) => {
                      return resident.section === section;
                    }).length
                  }
                </span>
                <span className="text-muted-foreground">Residents</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {
                    vacancies.filter((vacant) => {
                      return vacant.section === section;
                    }).length
                  }
                </span>
                <span className="text-muted-foreground">Vacancies</span>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </div>
  );
}

export default RAHeader;
