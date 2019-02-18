const St = imports.gi.St
const Main = imports.ui.main
const Tweener = imports.ui.tweener
const Mainloop = imports.mainloop
const GLib = imports.gi.GLib

let text, button, timerId

function padToTwo(number) {
  if (number <= 9) {
    number = ("0" + number)
  }
  return number
}

function padLabels(labelsCollection) {
  const lengthOfLongestString = Math.max.apply(null, labelsCollection.map(w => w.length))
  return labelsCollection.map(function (currentLabel) {
    const spacePaddingNeeded = lengthOfLongestString - currentLabel.length
    const padding = Array(spacePaddingNeeded + 2).join(' ')
    return currentLabel + padding
  })
}

function _updateLabel() {
  let netUsageToday = _netUsage().today
  let label = new St.Label({text: netUsageToday})
  button.set_child(label)
}

function _formatDataUsage(netUsageSummary, keywordToSearch) {
  let keyword = keywordToSearch

  if (keywordToSearch === 'month') {
    const dateNow = new Date()
    keyword = dateNow.getFullYear() + '-' + padToTwo(dateNow.getMonth() + 1) + '\\s+'
  }

  if (netUsageSummary && netUsageSummary !== '') {
    const regexKeyword = new RegExp(keyword + '[^|]+\\|[^|]+\\|([^|]+)\\|', "i")
    const rawMatch = netUsageSummary.match(regexKeyword)

    if (rawMatch) {
      const onlyTheFirstGroup = rawMatch[1].toString()

      if (onlyTheFirstGroup && onlyTheFirstGroup !== '') {
        return onlyTheFirstGroup.slice(0, -3)
      }
    }
  }

  return '0 K'
}

function _netUsage() {
  const interfaceNet = 'wlp3s0' // TODO: Should be able to change on extension settings
  const command = 'vnstat -i ' + interfaceNet
  const netUsageSummary = GLib.spawn_command_line_sync(command)[1].toString()
  // Collection
  return {
    today: _formatDataUsage(netUsageSummary, 'today'),
    yesterday: _formatDataUsage(netUsageSummary, 'yesterday'),
    month: _formatDataUsage(netUsageSummary, 'month')
  }
}

function _hideFullSummary() {
  Main.uiGroup.remove_actor(text)
  text = null
}

function _showFullSummary() {
  if (!text) {
    _updateLabel()
    let netUsage = _netUsage()
    let labels = padLabels(['Today', 'Yesterday', 'This Month'])
    let displayMessage = `${labels[0]} ${netUsage.today} \n${labels[1]} ${netUsage.yesterday} \n${labels[2]} ${netUsage.month}`
    text = new St.Label({style_class: 'full-data-summary', text: displayMessage})
    Main.uiGroup.add_actor(text)
  }

  text.opacity = 255

  let monitor = Main.layoutManager.primaryMonitor

  text.set_position(monitor.x + Math.floor(monitor.width - (text.width + 40)), 40)

  Tweener.addTween(text,
    {
      opacity: 0,
      time: 2,
      delay: 7,
      transition: 'easeOutQuad',
      onComplete: _hideFullSummary
    })
}

function init() {
  button = new St.Bin({
    style_class: 'panel-button',
    reactive: true,
    can_focus: true,
    x_fill: true,
    y_fill: false,
    track_hover: true
  })

  _updateLabel()
  timerId = Mainloop.timeout_add(5000, _updateLabel)

  button.connect('button-press-event', _showFullSummary)
}

function enable() {
  Main.panel._rightBox.insert_child_at_index(button, 0)
}

function disable() {
  Mainloop.source_remove(timerId)
  Main.panel._rightBox.remove_child(button)
}
