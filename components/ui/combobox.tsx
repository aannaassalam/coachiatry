"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CommandLoading } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useState } from "react";
import PriorityFlag from "../Tasks/PriorityFlag";
import { Badge } from "./badge";

type ComboboxOption = {
  label: string | React.ReactNode;
  value: string | number;
  bgColor?: string;
  textColor?: string;
  dotColor?: string;
  searchText?: string;
};

interface ComboboxProps {
  value?: string;
  onChange: (value: string | number) => void;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isBadge?: boolean;
  isFlag?: boolean;
}

interface ReactElementWithChildren extends React.ReactElement {
  props: {
    children?: React.ReactNode;
  };
}

const getStringFromNode = (node: string | React.ReactNode): string => {
  if (typeof node === "string") {
    return node;
  }

  if (React.isValidElement(node)) {
    const extractText = (element: React.ReactNode): string => {
      if (typeof element === "string") return element;
      if (typeof element === "number") return element.toString();

      if (React.isValidElement(element)) {
        const elementWithChildren = element as ReactElementWithChildren;
        if (elementWithChildren.props?.children) {
          const children = React.Children.toArray(
            elementWithChildren.props.children
          );
          for (const child of children) {
            const text = extractText(child);
            if (text) return text;
          }
        }
      }

      if (Array.isArray(element)) {
        for (const item of element) {
          const text = extractText(item);
          if (text) return text;
        }
      }

      return "";
    };

    return extractText(node) || "Option";
  }

  return "Option";
};

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  disabled,
  isLoading,
  isBadge,
  isFlag
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selected ? (
            isFlag ? (
              <div className="flex items-center gap-1.5">
                <PriorityFlag priority={selected.value as string} />
                <span>{selected.label}</span>
              </div>
            ) : !isBadge ? (
              selected.label
            ) : (
              <Badge
                className={cn(
                  "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                  selected.bgColor,
                  selected.textColor
                )}
              >
                <div
                  className={cn("size-1.5 rounded-full", selected.dotColor)}
                />
                {selected.label}
              </Badge>
            )
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}

          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command
          filter={(itemValue, search) => {
            const option = options.find((opt) => opt.value === itemValue);
            if (option) {
              const searchableText =
                option.searchText || getStringFromNode(option.label);
              if (searchableText.toLowerCase().includes(search.toLowerCase())) {
                return 1;
              }
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Search..." />

          <div>
            <CommandList>
              <CommandEmpty>No option found</CommandEmpty>
              {isLoading && (
                <CommandLoading className="p-2 px-3 text-sm text-center bg-gray-50">
                  Loading...
                </CommandLoading>
              )}
              <CommandGroup>
                {options.map((opt) => {
                  const titleText = getStringFromNode(opt.label);
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.value.toString()}
                      onSelect={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === opt.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {isBadge ? (
                        <Badge
                          className={cn(
                            "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                            opt.bgColor,
                            opt.textColor
                          )}
                        >
                          <div
                            className={cn(
                              "size-1.5 rounded-full",
                              opt.dotColor
                            )}
                          />
                          {opt.label}
                        </Badge>
                      ) : isFlag ? (
                        <div className="flex items-center gap-1.5">
                          <PriorityFlag priority={opt.value.toString()} />
                          <span>{opt.label}</span>
                        </div>
                      ) : (
                        <span
                          className="flex-1 truncate text-[13px]"
                          title={titleText}
                        >
                          {opt.label}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
