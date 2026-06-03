import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div className={"rounded-xl border-2 border-gray-300 bg-white shadow-sm " + className} {...props} />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={"p-4 border-b " + className} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h3 className={"text-lg font-semibold " + className} {...props}/>;
}

export function CardContent({ className = "", ...props }) {
  return <div className={"p-4 " + className} {...props} />;
}
