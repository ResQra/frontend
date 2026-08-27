import { Toaster as Sonner } from 'sonner'

function Toaster({ ...props }) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[#09090b] group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-2xl group-[.toaster]:font-mono group-[.toaster]:text-xs',
          description: 'group-[.toast]:text-zinc-400',
          actionButton:
            'group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:font-bold',
          cancelButton:
            'group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-300',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
