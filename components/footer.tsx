import { Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full bg-primary text-primary-foreground py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <h3 className="font-bold text-lg text-secondary">Next Gen Padel Academy</h3>
            <p className="text-sm opacity-80 text-center">Play. Learn. Grow.</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 text-center md:text-left">
            <div>
              <h4 className="font-semibold text-secondary mb-1">Riaan van den Berg</h4>
              <p className="text-xs opacity-70 mb-2">Co-Founder & Assistant Coach</p>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="size-4" />
                <a href="tel:0844122084" className="hover:text-secondary transition-colors">
                  084 412 2084
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">Gareth Nunes</h4>
              <p className="text-xs opacity-70 mb-2">Co-Founder & Head Coach</p>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="size-4" />
                <a href="tel:0663527053" className="hover:text-secondary transition-colors">
                  066 352 7053
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-secondary/30 mt-6 pt-6 text-center text-sm opacity-70">
          <p>&copy; {new Date().getFullYear()} Next Gen Padel Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
