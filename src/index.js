import './css/main.less'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import dict from './dict.js'
import Swal from 'sweetalert2'

const DIVS_PER_LINE = 5
const LEADING_BLANK_LINE = 1
const TRAILING_BLANK_LINE = 7
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

  let words = (tryLocalData() || dict).map((wordObj, idx) => {
    const { id, hanzi, word, pronunciation, translation } = wordObj
    return `<div class="block" draggable="true">
      <div class="word-block" data-id="${id}" data-hanzi="${hanzi}" data-word="${word}" data-pronunciation="${pronunciation}" data-translation="${translation}">
      <span>${hanzi}</span>
      <span class="hint" data-tippy-content="${word} (${pronunciation}) - ${translation}">❔</span>
      </div>
    </div>`
  })

  words = padBlankBlock(words)

  const container = document.querySelector('#container')
  container.innerHTML = words.join('')
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
    let words = Array.from(document.querySelectorAll('.word-block'))
    words = words
      .filter(el => !el.classList.contains('blank'))
      .map(el => el.dataset.id)

    window.localStorage.setItem('poem', JSON.stringify(words))
    Swal.fire({
      icon: 'success',
      text: '已保存在本地, 下次访问自动载入',
      toast: true,
      timer: 3000,
      position: 'top'
    })
  })
}, false)

function tryLocalData () {
  let localData = window.localStorage.getItem('poem')
  try {
    localData = JSON.parse(localData)
  } catch (error) {
    return null
  }

  if (localData && localData.length === dict.length) {
    const localPoem = []
    localData.forEach(idx => {
      localPoem.push(dict.find(word => {
        return word.id === parseInt(idx)
      }))
    })
    return localPoem
  }
}
