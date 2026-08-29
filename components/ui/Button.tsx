import { ReactNode } from 'react';
export default function Button({ children, ...props }: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="bg-black text-white px-4 py-2 rounded" {...props}>{children}</button>;
}
