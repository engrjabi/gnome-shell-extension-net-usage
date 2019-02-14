const St = imports.gi.St
const Main = imports.ui.main
const Tweener = imports.ui.tweener
const Mainloop = imports.mainloop
const GLib = imports.gi.GLib

let text, button

function _formatDataUsage(command, keyword) {
  const netUsageSummary = GLib.spawn_command_line_sync(command)[1].toString()

  if (netUsageSummary) {
    const regexKeyword = new RegExp(keyword + '.+', "i")
    const rawMatch = netUsageSummary.match(regexKeyword).toString()

    if (rawMatch) {
      const fullDataUsage = rawMatch.match(/\|[^\|]+\|(.+)\|/i)[1].toString()
      return fullDataUsage.slice(0, -3)
    }
  }

  return ''
}

function _netUsage(type) {
  // vnstat -i wlp3s0 -m | grep "`date +"%b '%y"`" FOR MONTH
  // Collection
  const mapping = {
    today: _formatDataUsage('vnstat -i wlp3s0', 'today'),
    yesterday: _formatDataUsage('vnstat -i wlp3s0', 'yesterday')
  }

  return mapping[type]
}

function _hideFullSummary() {
  Main.uiGroup.remove_actor(text)
  text = null
}

function _showFullSummary() {
  if (!text) {
    text = new St.Label({style_class: 'full-data-summary', text: 'Full data usage summary will be displayed here soon'})
    Main.uiGroup.add_actor(text)
  }

  text.opacity = 255

  let monitor = Main.layoutManager.primaryMonitor

  text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
    monitor.y + Math.floor(monitor.height / 2 - text.height / 2))

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

  let icon = new St.Icon({
    icon_name: 'system-run-symbolic',
    style_class: 'system-status-icon'
  })

  Mainloop.timeout_add(1000, function () {
    let displayLabel = _netUsage('yesterday') + "|Y" + _netUsage('today') + "|T"
    let label = new St.Label({text: displayLabel})
    button.set_child(label)
    return true
  })

  button.connect('button-press-event', _showFullSummary)
}

function enable() {
  Main.panel._rightBox.insert_child_at_index(button, 0)
}

function disable() {
  Main.panel._rightBox.remove_child(button)
}
