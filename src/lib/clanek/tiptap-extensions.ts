import StarterKit from '@tiptap/starter-kit'
import { ClanekImage } from './image-extension'
import { ClanekLink } from './link-extension'

// Jediné místo, které definuje sadu node/mark rozšíření — importuje ho jak editor
// (interactive: true), tak server renderer (interactive: false). Cokoli, co produkuje
// node/mark (nadpisy, seznamy, obrázek, odkaz), MUSÍ jít přes tuto funkci, jinak se
// editor a veřejný render mohou rozejít.
export function getClanekExtensions({ interactive = false }: { interactive?: boolean } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    ClanekImage,
    ClanekLink.configure({
      openOnClick: !interactive,
      autolink: false,
      suppressHrefInDom: interactive,
    }),
  ]
}
