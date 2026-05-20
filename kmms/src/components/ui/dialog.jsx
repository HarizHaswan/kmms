import * as DialogPrimitive from "@radix-ui/react-dialog";
import React from "react";

export function Dialog({ ...props }) {
  return <DialogPrimitive.Dialog {...props} />;
}

export function DialogTrigger({ ...props }) {
  return <DialogPrimitive.Trigger {...props} />;
}

export function DialogContent({ className = "", ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
      <DialogPrimitive.Content
        className={
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 shadow-xl w-full max-w-lg z-[100] " +
          className
        }
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className = "", ...props }) {
  return <div className={"mb-4 " + className} {...props} />;
}

export function DialogTitle({ className = "", ...props }) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h2 className={"text-xl font-bold " + className} {...props} />;
}

export function DialogDescription({ className = "", ...props }) {
  return (
    <p className={"text-sm text-gray-600 mb-2 " + className} {...props} />
  );
}
