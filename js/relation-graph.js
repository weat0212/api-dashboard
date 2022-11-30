var Graph = ForceGraph();
var data = {
    "nodes": [],
    "links": []
}

var detail = document.getElementById('detail')
var container = document.getElementById('container')
var graph = document.getElementById('graph')

function draw(graphObj, visibility) {

    console.log("開始畫圖...");
    data = graphDataBuilder(graphObj, visibility);

    Graph(graph)
        .graphData(data)
        .backgroundColor('#f8f9fa')
        .onNodeClick((node) => {
            removeChildren(detail);
            for (const [key, value] of Object.entries(node)) {
                const div = detail.appendChild(document.createElement('div'));
                div.textContent = `${key}:${value}`;
            }
        })
        .linkWidth(3)
        .nodeAutoColorBy('controller')
        .nodeCanvasObject((node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
        })
        .nodePointerAreaPaint((node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
        });

    adjustGraphSize(Graph)
    window.addEventListener('resize', () => {
        adjustGraphSize(Graph)
    })
}

function removeChildren(dom) {
    while (dom.firstChild) { dom.removeChild(dom.firstChild) }
}

function adjustGraphSize(graph) {
    graph.width(container.offsetWidth).height(window.innerHeight - 100)
}

function graphDataBuilder(graphs, visibility) {

    console.log("製作圖型物件...");
    console.log(graphs);

    let nodes = [];
    let links = [];

    for (let graph of graphs) {
        if (!graph.serviceId) { continue; }

        nodes.push({
            "id": graph.serviceId,
            "serviceId": graph.serviceId,
            "name": graph.func,
            "path": graph.path,
            "project": graph.project,
            "contextPath": graph.contextPath,
            "controller": graph.controller,
            "method": graph.method,
            "api": graph.api,
            "isOpenOutside": graph.isOpenOutside,
            "memo": graph.memo,
            "Reference": graph.Reference,
        });

        if (graph.Reference) {
            let refs = graph.Reference.split(',');
            for (let ref of refs) {
                if (ref.startsWith("API")) {
                    links.push({
                        "source": graph.serviceId, "target": ref
                    })
                }
            }
        }
    }

    if (visibility) {
        nodes = nodes.filter(n => {
            let show = false;
            links.forEach(l => {
                if (n.serviceId === l.source || n.serviceId === l.target) {
                    show = true;
                }
            })
            return show;
        })
    }

    return {nodes, links};
}
