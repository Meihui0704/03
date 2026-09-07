export default {
  data () {
    return {
      assetViewer: { visible: false, src: '', title: '', filename: '' }
    }
  },
  methods: {
    fitImageFileToSquare (file, size = 80) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('no file'))
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('read fail'))
        reader.onload = () => {
          const image = new Image()
          image.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            const scale = Math.max(size / image.width, size / image.height)
            const drawW = image.width * scale
            const drawH = image.height * scale
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, size, size)
            ctx.drawImage(image, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH)
            resolve(canvas.toDataURL('image/png'))
          }
          image.onerror = () => reject(new Error('image fail'))
          image.src = reader.result
        }
        reader.readAsDataURL(file)
      })
    },
    letterIconDataUrl (letter, bg = '#fff1f2', fg = '#a90a13', size = 320) {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = fg
      ctx.font = `800 ${Math.round(size * 0.42)}px "PingFang SC","Helvetica Neue",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(letter || '图').slice(0, 1), size / 2, size / 2 + size * 0.02)
      return canvas.toDataURL('image/png')
    },
    openAssetViewer ({ src, title, filename }) {
      this.assetViewer = { visible: true, src: src || '', title: title || '完整查看', filename: filename || 'icon.png' }
    },
    closeAssetViewer () {
      this.assetViewer.visible = false
    },
    downloadAssetSrc (src, filename) {
      if (!src) {
        this.$message.warning('没有可下载的图片')
        return
      }
      const link = document.createElement('a')
      link.href = src
      link.download = filename || 'asset.png'
      document.body.appendChild(link)
      link.click()
      link.remove()
      this.$message.success('已开始下载（仅当前演示）')
    },
    downloadFromViewer () {
      this.downloadAssetSrc(this.assetViewer.src, this.assetViewer.filename)
    }
  }
}
