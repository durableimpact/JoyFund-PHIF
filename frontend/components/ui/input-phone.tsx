"use client";

import React, { useCallback, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";

const CustomInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      className={`rounded-e-lg rounded-s-none ${className}`}
      {...props}
    />
  );
});
CustomInput.displayName = "CustomInput";

type InputPhoneProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };
export const InputPhone: React.ForwardRefExoticComponent<InputPhoneProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, InputPhoneProps>(
    ({ className, onChange, ...props }, ref) => {
      return (
        <RPNInput.default
          ref={ref}
          className={cn("flex", className)}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={CustomInput}
          /**
           * Handles the onChange event.
           *
           * react-phone-number-input might trigger the onChange event as undefined
           * when a valid phone number is not entered. To prevent this,
           * the value is coerced to an empty string.
           *
           * @param {E164Number | undefined} value - The entered value
           */
          onChange={(value) => {
            if (value) onChange?.(value);
          }}
          {...props}
        />
      );
    },
  );
InputPhone.displayName = "InputPhone";

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = useCallback(
    (country: RPNInput.Country) => {
      onChange(country);
    },
    [onChange],
  );

  const [open, setOpen] = useState(false);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={"outline"}
            className={cn("flex gap-1 rounded-e-none rounded-s-lg px-3")}
            disabled={disabled}
          >
            <FlagComponent country={value} countryName={value} />
            <ChevronsUpDown
              className={cn(
                "-mr-2 size-4 opacity-50",
                disabled ? "hidden" : "opacity-100",
              )}
            />
          </Button>
        }
      />
      <PopoverContent className="w-75 p-0" align="start">
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput placeholder="Search country..." />
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {options
                  .filter((x) => x.value)
                  .map((option) => (
                    <CommandItem
                      className="gap-2"
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      {option.value && (
                        <span className="text-sm text-foreground/50">
                          {`+${RPNInput.getCountryCallingCode(option.value)}`}
                        </span>
                      )}
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          option.value === value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};
FlagComponent.displayName = "FlagComponent";

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};
