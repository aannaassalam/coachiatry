"use client";
import { X } from "lucide-react";
import { Input } from "../ui/input";

import assets from "@/json/assets";
import Image from "next/image";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "../ui/button";

export default function SubtaskList({ disabled }: { disabled?: boolean }) {
  const {
    control,
    formState: { errors }
  } = useFormContext();

  const { append, remove, fields } = useFieldArray({
    name: "subtasks",
    control
  });

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent form submit
      // only add a new subtask when pressing Enter in the last one
      if (index === fields.length - 1 && !disabled) {
        append({ title: "", completed: false });
        // focus new input after adding
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>(
            'input[name^="subtasks"]'
          );
          inputs[inputs.length - 1]?.focus();
        }, 50);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-base text-gray-500 font-lato">
          Subtasks
        </p>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-gray-500">No subtasks yet.</p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                {...control.register(`subtasks.${index}.title` as const)} // register each subtask
                placeholder={`Subtask ${index + 1}`}
                disabled={disabled}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-gray-500 hover:text-gray-700"
                center
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {Array.isArray(errors.subtasks) &&
              errors.subtasks?.[index]?.title && (
                <p className="text-sm text-red-500">
                  {errors.subtasks[index]?.title?.message as string}
                </p>
              )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: "", completed: false })}
        className="text-gray-500 text-[12px]"
        disabled={disabled}
      >
        <Image src={assets.icons.plus} alt="add" width={14} height={14} />
        Add Subtask
      </Button>
    </div>
  );
}
