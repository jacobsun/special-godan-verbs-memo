import './css/main.less'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import dict from './dict.js'
import Swal from 'sweetalert2'

const DIVS_PER_LINE = 9
const LEADING_BLANK_LINE = 1
const TRAILING_BLANK_LINE = 7
const NOT_JLPT = ['阿る',
  '過る',
  '競る',
  '繁る',
  '陰る',
  '猛る',
  '滾る',
  '伏せる',
  '陥る',
  '覆る',
  '攀じる',
  '迸る',
  '甦る',
  '穿る',
  '抉る',
  '漲る',
  '嘲る',
  '誹る',
  '謗る',
  '譏る',
  '熬る',
  '舐める',
  '脂ぎる',
  '火照る',
  '滅入る',
  '野次る',
  '愚痴る',
  '魂消る']
window.addEventListener('DOMContentLoaded', e => {
  function handleDragStart (e) {
    this.style.opacity = '0.4'
    dragSrcEl = this
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', this.innerHTML)
  }

  function handleDragOver (e) {
    if (e.preventDefault) {
      e.preventDefault()
    }
    e.dataTransfer.dropEffect = 'move'
    return false
  }

  function handleDragEnter (e) {
    if (e.target.classList.contains('word-block')) {
      e.target.classList.add('over')
    }
  }

  function handleDragLeave (e) {
    // if we still in children elements, do nothing
    if (this.contains(e.relatedTarget)) return
    e.target.classList.remove('over')
  }

  function handleDragEnd (e) {
    // if (this.contains(e.relativeTarget)) return
    this.style.opacity = '1'
    const over = document.querySelector('.over')
    if (over) {
      over.classList.remove('over')
    }
  }

  function handleDrop (e) {
    if (e.stopPropagation) {
      e.stopPropagation() // stops the browser from redirecting.
    }

    if (dragSrcEl === this) return

    dragSrcEl.innerHTML = this.innerHTML
    this.innerHTML = e.dataTransfer.getData('text/html')
    setDraggable(this)
    setDraggable(dragSrcEl)

    function setDraggable (el) {
      const wordBlock = el.querySelector('.word-block')
      if (wordBlock.classList.contains('blank')) {
        el.setAttribute('draggable', false)
      } else {
        el.setAttribute('draggable', true)
      }
    }

    tippy('[data-tippy-content]')
  }

  let dragSrcEl = null

  function padBlankBlock (arr) {
    const blankEle = `<div class="block" draggable="false">
    <div  class="word-block blank">
    <span>X</span>
    </div></div>`

    let numberBeRectangle = DIVS_PER_LINE - arr.length % DIVS_PER_LINE
    while (numberBeRectangle-- > 0) {
      arr.push(blankEle)
    }

    for (let n = LEADING_BLANK_LINE * DIVS_PER_LINE; n > 0; n--) {
      arr.unshift(blankEle)
    }

    for (let n = TRAILING_BLANK_LINE * DIVS_PER_LINE; n > 0; n--) {
      arr.push(blankEle)
    }

    return arr
  }

  function generateEl (dict) {
    const words = dict.map((wordObj, idx) => {
      const { id, hanzi, word, pronunciation, translation } = wordObj
      return `<div class="block" draggable="true">
        <div class="word-block" data-id="${id}" data-hanzi="${hanzi}" data-word="${word}" data-pronunciation="${pronunciation}" data-translation="${translation}">
        <span>${hanzi}</span>
        <span class="hint" data-tippy-content="${word} (${pronunciation}) - ${translation}">❔</span>
        </div>
      </div>`
    })

    return padBlankBlock(words)
  }

  const container = document.querySelector('#container')
  function boot (data = null) {
    if (data) {
      container.innerHTML = generateEl(data).join('')
    } else {
      const localData = tryLocalData()
      if (localData) {
        container.innerHTML = localData
      } else {
        container.innerHTML = generateEl(dict).join('')
      }
    }

    tippy('[data-tippy-content]')

    const blocks = document.querySelectorAll('.block')
    blocks.forEach(block => {
      block.addEventListener('drop', handleDrop, false)
      block.addEventListener('dragstart', handleDragStart, false)
      block.addEventListener('dragenter', handleDragEnter, false)
      block.addEventListener('dragover', handleDragOver, false)
      block.addEventListener('dragleave', handleDragLeave, false)
      block.addEventListener('dragend', handleDragEnd, false)
    })
  }
  boot()

  // const foldable = document.querySelector('.foldable')
  document.querySelector('.toggle-help').addEventListener('click', async e => {
    e.preventDefault()
    await Swal.fire({
      title: '帮助',
      html: `<div class="help-text">
      <p>日语中以i段或e段+る结尾动词多为一段(2类)动词, 其他结尾是五段动词. 本页面收集了符合一段特征但却是五段的动词.</p>
      <p>为了方便的编出好记的"顺口溜", 特意写了这个程序, 你可以拖动文字到其他文字或空白块上, 移动他们的位置.</p>
      <p>满意后, 点击底部的保存结果按钮.</p>
    </div>`,
      confirmButtonText: '好的',
      customClass: {
        container: 'help-container'
      }
    })
  })

  document.querySelector('.copy-result').addEventListener('click', async e => {
    const words = Array.from(document.querySelectorAll('.word-block'))
    const poem = []
    const source = []
    for (let i = 0; i < words.length; i++) {
      const ele = words[i]
      if (ele.classList.contains('blank')) continue
      const wordLine = Math.floor(i / DIVS_PER_LINE)
      if (!poem[wordLine]) poem[wordLine] = ''
      poem[wordLine] += ele.dataset.hanzi

      if (!source[wordLine]) source[wordLine] = ''
      let { word, pronunciation, translation } = ele.dataset
      pronunciation = '(' + pronunciation + ')'
      source.push(`${word.padEnd(4)}${pronunciation.padEnd(12)}:${translation}`)
    }

    const result = await Swal.fire({
      title: '你的作品, 快快分享出去吧.',
      html: `<textarea>${poem.join('\n')} \n\n\n\n ${source.join('\n')}</textarea>`,
      showCancelButton: true,
      confirmButtonText: '复制',
      cancelButtonText: '关闭',
      customClass: {
        container: 'result-container'
      }
    })

    if (result.isConfirmed) {
      document.querySelector('textarea').select()
      document.execCommand('copy')
      Swal.fire('已复制', '', 'success')
    }
  }, false)

  document.querySelector('.save-result').addEventListener('click', e => {
    const status = document.querySelector('#container').innerHTML

    window.localStorage.setItem('poem', JSON.stringify(status))
    Swal.fire({
      icon: 'success',
      text: '已保存在本地, 下次访问自动载入',
      toast: true,
      timer: 3000,
      position: 'top'
    })
  })

  document.querySelector('.filter').addEventListener('click', async e => {
    const commonDict = dict.filter(item => !NOT_JLPT.includes(item.word))
    const result = await Swal.fire({
      title: '确定?',
      text: '当前作品会丢失',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消'

    })
    if (result.isConfirmed) {
      boot(commonDict)
    }
  })

  document.querySelector('.all').addEventListener('click', async e => {
    const result = await Swal.fire({
      title: '确定?',
      text: '当前作品会丢失',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    if (result.isConfirmed) {
      boot(dict)
    }
  })

  document.querySelector('#cloak').style.display = 'none'
}, false)

function tryLocalData () {
  let localData = window.localStorage.getItem('poem')
  try {
    localData = JSON.parse(localData)
  } catch (error) {
    return null
  }

  return localData
}
