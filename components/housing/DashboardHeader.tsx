"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

export type DashboardStat = {
  value: number | string;
  label: string;
};

type Props = {
  roleLabel: string;
  name: string;
  subtitle?: string;
  stats?: DashboardStat[];
};

function DashboardHeader({ roleLabel, name, subtitle, stats = [] }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardContent className="space-y-1 py-2">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
              <p className="text-lg font-semibold">{name}</p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronsUpDown />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
            {stats.length > 0 ? (
              <>
                <Separator className="my-1" />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-1">
                      <span className="font-medium">{stat.value}</span>
                      <span className="text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </div>
  );
}

export default DashboardHeader;
