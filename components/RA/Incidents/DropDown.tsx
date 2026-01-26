"use client";

import { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

interface Props {
  dropdown: string;
  setDropdown: Dispatch<SetStateAction<string>>;
}

function DropDown({ dropdown, setDropdown }: Props) {
  return (
    <>
      <Select value={dropdown} onValueChange={setDropdown}>
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All</SelectItem>
          <SelectItem value="Maintenance">Maintenance</SelectItem>
          <SelectItem value="Policy Violation">Policy Violation</SelectItem>
          <SelectItem value="Health and Safety">Health and Safety</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

export default DropDown;
