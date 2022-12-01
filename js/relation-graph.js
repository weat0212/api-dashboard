let Graph = ForceGraph();
let data = {
    "nodes": [],
    "links": []
}

let detail = document.getElementById('detail');
let container = document.getElementById('container');
let graph = document.getElementById('graph');
let hide = document.getElementById('visibility');

/**
 * 畫圖
 * @param graphObj
 * @param hide
 */
function draw(graphObj) {

    console.log("開始畫圖...");
    data = graphDataBuilder(graphObj);

    // 反白節點/關聯
    const highlightNodes = new Set();
    const highlightLinks = new Set();
    let hoverNode = null;

    Graph(graph)
        .graphData(data)
        .backgroundColor('#f8f9fa')
        .onNodeClick((node) => {
            removeChildren(detail);
            for (const [key, value] of Object.entries(node)) {
                const div = detail.appendChild(document.createElement('div'));
                div.textContent = `${key}:${value}`;
            }
            // Center/zoom on node
            Graph.centerAt(node.x, node.y, 1000);
            Graph.zoom(8, 1500);
        })
        .onNodeHover(node => {
            highlightNodes.clear();
            highlightLinks.clear();
            if (node) {
                highlightNodes.add(node);
                node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
                node.links.forEach(link => highlightLinks.add(link));
            }

            hoverNode = node || null;
        })
        .onLinkHover(link => {
            highlightNodes.clear();
            highlightLinks.clear();

            if (link) {
                highlightLinks.add(link);
                highlightNodes.add(link.source);
                highlightNodes.add(link.target);
            }
        })
        .autoPauseRedraw(false)
        .nodeAutoColorBy('controller')
        .nodeLabel('memo')
        .nodeCanvasObject((node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 16/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            // 圖形
            const isSelected = node === hoverNode;
            ctx.fillStyle = isSelected ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)';
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
        })
        .linkWidth(link => highlightLinks.has(link) ? 5 : 1)
        .linkDirectionalParticleWidth(link => highlightLinks.has(link) ? 4 : 0)
        .linkDirectionalArrowLength(3)
        .linkDirectionalParticles(5)
        .linkDirectionalParticleSpeed(0.004);

    adjustGraphSize(Graph)
    window.addEventListener('resize', () => {
        adjustGraphSize(Graph)
    });
}

function removeChildren(dom) {
    while (dom.firstChild) { dom.removeChild(dom.firstChild) }
}

function adjustGraphSize(graph) {
    graph.width(container.offsetWidth).height(window.innerHeight - 100);
}

/**
 * 製作圖形物件
 * @param graphs
 * @returns {{nodes: *[], links: *[]}}
 */
function graphDataBuilder(graphs) {

    console.log("製作圖型物件...");
    console.log(graphs);

    let nodes = [];
    let links = [];

    for (let graph of graphs) {
        if (!graph.serviceId) { continue; }

        nodes.push(getNodeFrom(graph));

        if (graph.Reference) {
            let refs = graph.Reference.split(',');
            for (let ref of refs) {
                if (!ref.startsWith("API")) {
                    // 非API
                    let tmpNode = {
                        "id": ref,
                        "serviceId": ref,
                        "controller": 'reference',
                        "memo": '功能項',
                        "neighbors": [],
                        "links": [],
                    };
                    let existed = nodes.filter(n => n.id === ref).length > 0;
                    if (!existed) {
                        nodes.push(tmpNode);
                    }
                }
                links.push(getLink(graph.serviceId, ref))
            }
        }
    }

    if (hide.checked) {
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

    // 記住鄰居節點
    links.forEach(link => {
        const a = nodes.filter(n => n.id === link.source)[0];
        const b = nodes.filter(n => n.id === link.target)[0];

        a.neighbors.push(b);
        b.neighbors.push(a);
        a.links.push(link);
        b.links.push(link);
    });

    return {nodes, links};
}

/**
 * 產生圖形
 * @param graph
 * @returns
 */
function getNodeFrom(graph) {
    return {
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
        "neighbors": [],
        "links": []
    };
}

/**
 * 產生連結物件
 * @param source
 * @param ref
 * @returns {{source, target}}
 */
function getLink(source, ref) {
    return {
        "source": source, "target": ref
    };
}


/**
 * 畫圓圈節點
 * @param ctx
 * @param node
 * @param width
 */
function drawCircle(ctx, node, width) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, width, 0, 2 * Math.PI);
    ctx.strokeStyle = node.color;
    ctx.stroke();

    ctx.shadowColor = 'rgba(105, 105, 105, .3)';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
}
