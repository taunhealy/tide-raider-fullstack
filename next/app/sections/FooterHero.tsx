export default function FooterHero() {
  return (
    <section className="relative h-[60vh] bg-[#001341] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full opacity-27"
        style={{
          backgroundImage: 'url("/footer-hero.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-8">
        <h1 className="heading-1 text-white text-5xl font-bold mb-8">
          Worth every nugget
        </h1>
        <a 
          href="/signup" 
          className="bg-white text-[#001341] px-8 py-4 rounded-full text-xl font-semibold hover:bg-opacity-90 transition-all"
        >
          Start Surfing Today
        </a>
      </div>
    </section>
  )
}