"use client";

import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function ListSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: Props) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full hover:bg-gray-200 dark:hover:bg-muted p-1 absolute right-2 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-muted-foreground" />
        </button>
      ) : null}
    </InputGroup>
  );
}

export default ListSearchInput;
