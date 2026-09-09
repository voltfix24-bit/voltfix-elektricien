export async function uploadLeadPhotos(
  photos: File[],
  upload: (options: { data: { filename: string; contentType: 'image/jpeg' | 'image/png' | 'image/webp'; dataBase64: string } }) => Promise<{ path: string }>,
) {
  const paths: string[] = []
  for (const photo of photos) {
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result.slice(reader.result.indexOf(',') + 1)) : reject(new Error('Foto lezen mislukt.'))
      reader.onerror = () => reject(new Error('Foto lezen mislukt.'))
      reader.readAsDataURL(photo)
    })
    const result = await upload({ data: { filename: photo.name.slice(0, 120), contentType: photo.type as 'image/jpeg' | 'image/png' | 'image/webp', dataBase64 } })
    paths.push(result.path)
  }
  return paths
}