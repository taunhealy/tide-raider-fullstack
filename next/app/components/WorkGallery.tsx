interface Props {
    works: any[];
    categories: any[];
  }
  
  export default function WorkGallery({ works, categories }: Props) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
        {works.map((work) => (
          <div key={work.slug.current} className="relative group">
            <img 
              src={work.coverImage.asset.url} 
              alt={work.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-4 text-white">
                <h3 className="text-xl font-bold">{work.title}</h3>
                <p className="mt-2">{work.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }