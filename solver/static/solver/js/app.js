var data = {
  nodes: [
    // {id: 0, x: 0, y: 0, title: '0', data: {}},
    // {id: 1, x: 200, y: 0, title: '1', data: {}},
    // {id: 2, x: 100, y: 200, title: '3', data: {}}
  ],
  links: [
    // {source: 0, target: 1, size: 2, title: '0-1', data: {}},
    // {source: 1, target: 2, size: 4, title: '1-2', data: {}},
    // {source: 0, target: 0, size: 2, title: '0-0', data: {}},
    // {source: 2, target: 0, size: 2, title: '2-0', data: {}}
  ]
};

var options = {
  directed: true
};

var graph = new ge.GraphEditor('#graph', data, options);
var shift = false;

graph
  .on('click', function (pos) {
    if (shift) {
      graph.add({x: pos[0], y: pos[1]});
    } else {
      graph.select(null);
      updateSelection();
    }
  })
  .on('node-click', function (node) {
    graph.select(node);
    updateSelection();
  })
  .on('link-click', function (link) {
    graph.select(link);
    updateSelection();
  })
  .on('new-link-end', function (source, target) {
    graph.add({source: source, target: target});
  });

document.body.addEventListener('keydown', function (ev) {
  switch (ev.key) {
    case 'Shift':
      shift = true;
      graph.dragToLink(true);
      break;
    case 'Delete':
      var selection = graph.select();
      if (selection.node) {
        graph.remove(selection.node);
      }
      if (selection.link) {
        graph.remove(selection.link);
      }
      updateSelection();
      break;
    case 's':
    case 'S':
      graph.simulation('toggle');
      break;
  }
});
document.body.addEventListener('keyup', function (ev) {
  switch (ev.key) {
    case 'Shift':
      shift = false;
      graph.dragToLink(false);
      break;
  }
});
d3.select('#node-title').on('keydown', function (ev) {
  d3.event.stopPropagation();
});
d3.select('#node-prod-rate').on('keydown', function (ev) {
  d3.event.stopPropagation();
});
d3.select('#node-use-rate').on('keydown', function (ev) {
  d3.event.stopPropagation();
});
d3.select('#link-title').on('keydown', function (ev) {
  d3.event.stopPropagation();
});
d3.select('#link-weight').on('keydown', function (ev) {
  d3.event.stopPropagation();
});
d3.select('#data').on('keydown', function (ev) {
  d3.event.stopPropagation();
});

function updateSelection() {
  var selection = graph.select();
  var node = d3.select('#selected-node').classed('hide', !selection.node);
  var link = d3.select('#selected-link').classed('hide', !selection.link);
  if (selection.node) {
    d3.select('#node-title').property('value', selection.node.title);

    if (!selection.node.prod_rate) {
      selection.node.prod_rate = 0
    }
    d3.select('#node-prod-rate').property('value', selection.node.prod_rate);

    if (!selection.node.use_rate) {
      selection.node.use_rate = 0
    }
    d3.select('#node-use-rate').property('value', selection.node.use_rate);

    d3.select('#node-shape').property('value', selection.node.shape.constructor.name);
  }
  if (selection.link) {
    if (!selection.link.weight) selection.link.weight = 0
    d3.select('#link-weight').property('value', selection.link.weight);
    d3.select('#link-title').property('value', selection.link.weight);
  }
}

function openModal(modal) {
  if (typeof modal === 'string') {
    modal = d3.select(modal);
  }
  modal.classed('hide', false);
  setTimeout(function () {
    modal.classed('active', true);
  }, 100);
}

function closeModal(modal) {
  if (typeof modal === 'string') {
    modal = d3.select(modal);
  }
  modal.classed('active', false);
  setTimeout(function () {
    modal.classed('hide', true);
  }, 300);
}

function importModal() {
  var modal = d3.select('.modal-bg');
  var data = '{\n    "nodes": [],\n    "links": []\n}';
  var textarea = modal.select('textarea')
    .property('value', data);
  var error = modal.select('.error').classed('hide', true);
  modal.select('.modal-title').text('Import');
  modal.select('.modal-ok').on('click.modal', function () {
    try {
      d3.event.preventDefault();
      var data = JSON.parse(textarea.property('value'));
      graph.clear();
      if (data.nodes) {
        graph.addNodes(data.nodes);
      }
      if (data.links) {
        graph.addLinks(data.links);
      }
      data.nodes.forEach((node, index) => {
        graph.data.nodes[node.id].use_rate = data.nodes[node.id].use_rate
        graph.data.nodes[node.id].prod_rate = data.nodes[node.id].prod_rate
      })
      data.links.forEach((link, index) => {
        graph.data.links.find(l => l.id === link.id).weight = data.links.find(li => li.id === link.id).weight
      })

      closeModal(modal);
    } catch (err) {
      var msg = err.toString();
      if (err.stack) {
        msg += '\n';
        msg += err.stack.toString();
      }
      error.classed('hide', false).text(msg);
    }
  });
  openModal(modal);
}

function exportModal() {
  var modal = d3.select('.modal-bg');
  var jGraph = graph.toJson()
  jGraph.nodes.forEach((node, index) => {
    var use_rate = graph.data.nodes[node.id].use_rate
    var prod_rate = graph.data.nodes[node.id].prod_rate
    node.use_rate = use_rate
    node.prod_rate = prod_rate

    if (!use_rate) node.use_rate = 0
    if (!prod_rate) node.prod_rate = 0
  })
  jGraph.links.forEach((link, index) => {
    var weight = graph.data.links.find(l => l.id === link.id).weight
    link.weight = weight

    if (!weight) link.weight = 0
  })

  var data = JSON.stringify(jGraph, null, 4);
  modal.select('.error').classed('hide', true);
  modal.select('.modal-title').text('Export');
  modal.select('textarea').property('value', data);
  modal.select('.modal-ok').on('click.modal', function () {
    d3.event.preventDefault();
    closeModal(modal);
  });
  openModal(modal);
}

function resultsModal(data) {
  var modal = d3.select('.modal-bg');
  modal.select('.error').classed('hide', true);
  modal.select('.modal-title').text('Results');
  var text = `Status: ${data.status}\n\nModel: ${data.model}\n\nReport: ${data.report}`
  modal.select('textarea').property('value', text);
  modal.select('.modal-ok').on('click.modal', function () {
    d3.event.preventDefault();
    closeModal(modal);
  });
  openModal(modal);
}

function calculate() {
  const d = {};
  d.nodes = []
  d.links = []

  graph.data.nodes.forEach((node, index) => {
    if (!node.prod_rate) node.prod_rate = 0
    if (!node.use_rate) node.use_rate = 0
    d.nodes.push({'id': node.id, 'prod_rate': node.prod_rate, 'use_rate': node.use_rate})
  })
  graph.data.links.forEach((link, index) => {
    if (!link.weight) link.weight = 0
    d.links.push({'from': link.source.id, 'to': link.target.id, 'weight': link.weight})
  })

  const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;


  $.ajax({
    url: "",
    cache: false,
    headers: {'X-CSRFToken': csrftoken},
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(d),
    success: function (res) {
      resultsModal(res)
    }
  })
}


var modal = d3.select('.modal-bg');
modal.on('click.modal', function () {
  closeModal(modal);
});

modal.select('.modal').on('click.modal', function () {
  d3.event.stopPropagation();
});

modal.select('.modal-cancel').on('click.modal', function () {
  d3.event.preventDefault();
  closeModal(modal);
});

modal.select('#copy').on('click.modal', function () {
  d3.event.preventDefault();
  var textarea = modal.select('textarea').node();
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
});


d3.select('#import').on('click', function () {
  d3.event.preventDefault();
  importModal();
});

d3.select('#export').on('click', function () {
  d3.event.preventDefault();
  exportModal();
});

d3.select('#calculate').on('click', function () {
  d3.event.preventDefault();
  calculate();
});

d3.select('#node-title').on('input', function () {
  var node = graph.selectNode();
  node.title = this.value;
  graph.updateNode(node);
});

d3.select('#node-prod-rate').on('input', function () {
  var node = graph.selectNode();
  node.prod_rate = this.value;
  graph.updateNode(node);
});

d3.select('#node-use-rate').on('input', function () {
  var node = graph.selectNode();
  node.use_rate = this.value;
  graph.updateNode(node);
});

d3.select('#node-shape').on('change', function () {
  var shape = new ge.shape[this.value]({aspect: 2});
  var node = graph.selectNode();
  node.shape = shape;
  node.prevTitle = null;
  graph.updateNode(node);
});

// links
d3.select('#link-title').on('input', function () {
  var link = graph.selectLink();
  link.title = this.value;
  graph.updateLink(link);
});

d3.select('#link-weight').on('input', function () {
  var link = graph.selectLink();
  link.weight = this.value;
  link.title = this.value;
  graph.updateLink(link);
});
