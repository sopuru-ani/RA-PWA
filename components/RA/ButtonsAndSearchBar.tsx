"use client";
import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useState, Dispatch, SetStateAction } from "react";

interface Props {
  selected: string;
  sort: string;
  search: string;
  setSelected: Dispatch<SetStateAction<string>>;
  setSort: Dispatch<SetStateAction<string>>;
  setSearch: Dispatch<SetStateAction<string>>;
}
function ButtonsAndSearchBar({
  selected,
  sort,
  search,
  setSelected,
  setSort,
  setSearch,
}: Props) {
  // const [selected, setSelected] = useState("Section");
  // const [sort, setSort] = useState("Names");
  return (
    <>
      {/* <div className="flex flex-row justify-between"> */}
      <div className="grid md:[grid-template-areas:'a_c_b'] md:grid-cols-[auto_1fr_auto] md:grid-rows-1 [grid-template-areas:'a_b'_'c_c'] grid-cols-2 grid-rows-2 gap-2 pb-2">
        <ToggleGroup
          className="[grid-area:a]"
          type="single"
          variant="outline"
          value={selected}
          onValueChange={(value) => value && setSelected(value)}
        >
          <ToggleGroupItem
            value="Section"
            className="data-[state=on]:bg-primary data-[state=on]:text-white"
          >
            Section
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Community"
            className="data-[state=on]:bg-primary data-[state=on]:text-white"
          >
            Community
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          className="[grid-area:b] justify-self-end"
          type="single"
          variant="outline"
          value={sort}
          onValueChange={(value) => value && setSort(value)}
        >
          <ToggleGroupItem
            value="Names"
            className="data-[state=on]:bg-primary data-[state=on]:text-white"
          >
            Names
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Rooms"
            className="data-[state=on]:bg-primary data-[state=on]:text-white"
          >
            Rooms
          </ToggleGroupItem>
        </ToggleGroup>
        <InputGroup className="[grid-area:c] w-full">
          <InputGroupInput
            placeholder="search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="rounded-full hover:bg-gray-200 p-1 absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </InputGroup>
      </div>
      {/* </div> */}
    </>
  );
}

export default ButtonsAndSearchBar;
