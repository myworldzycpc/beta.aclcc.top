/*
This work is dedicated to the public domain. For details, see the LICENSE file in the project root.
 */

let width = window.innerWidth, height = window.innerHeight - 60;

let nodes = [];
let links = [];
for (const id in groups) {
    const group = groups[id];
    nodes.push({
        "id": `group_${id}`,
        "title": group.name,
        "color": "#FF3030",
        "size": (group.sizeOverride || group.memberCount) / 2 + 10
    })
}
for (const id in members) {
    const member = members[id];
    nodes.push({
        "id": `member_${id}`,
        "title": member.name,
        "color": "#0080FF",
        "size": (member.level || 1) / 10 + 1,
        "level": member.level
    })
    for (const groupId of member.groups) {
        links.push({
            "source": `member_${id}`,
            "target": `group_${groupId}`
        });
    }
}

const svg = d3.select('#container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'chart')
    .attr('id', 'chart')

// 创建仿真
const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody())
    .force('link', d3.forceLink(links).id(d => d.id))
    .force('x', d3.forceX(width / 2))
    .force('y', d3.forceY(height / 2))
    .force("collide", d3.forceCollide().radius(d => (d.size || 15) + 5));

simulation.alphaDecay(0.05)

simulation.force('charge')
    .strength(-500) // 调整排斥力，使节点分布更合理

simulation.force('link')
    .distance(200) // 增加连接距离，使图形更清晰
    .strength(1)
    .iterations(1)

// 绘制连线
const simulationLinks = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', '#c2c2c280')
    .attr('stroke-width', 1.5)

// 创建节点组，用于包含圆和文字
const nodeGroups = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('.node-group')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node-group')
    .call(d3.drag()
        .on('start', started)
        .on('drag', dragged)
        .on('end', ended)
    )
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut);

// 绘制节点圆圈
const simulationNodes = nodeGroups.append('circle')
    .attr('r', d => d.size) // 使用节点大小
    .attr('fill', d => d.color) // 使用节点颜色
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')

// 绘制节点下方的title文字
const nodeTitles = nodeGroups.append('text')
    .text(d => d.title)
    .attr('text-anchor', 'middle')
    .attr('dy', d => d.size + 15) // 文字位置在节点下方
    .attr('font-size', 12)
    .attr('fill', '#fff');

// 拖拽函数
function started(d) {
    if (!d3.event.active) {
        simulation.alphaTarget(0.2).restart()
    }
    d.fx = d.x
    d.fy = d.y
}

function dragged(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
}

function ended(d) {
    if (!d3.event.active) {
        simulation.alphaTarget(0)
    }
    d.fx = null
    d.fy = null
}

// 悬停处理函数 - 突出显示相关节点和边
function handleMouseOver(event, index) {
    const d = nodes[index];
    // 获取与当前节点直接相连的节点ID
    const connectedNodeIds = new Set();
    connectedNodeIds.add(d.id); // 包含当前节点

    // 找到所有相关的边和节点
    links.forEach(link => {
        if (link.source.id === d.id) {
            connectedNodeIds.add(link.target.id);
        } else if (link.target.id === d.id) {
            connectedNodeIds.add(link.source.id);
        }
    });

    // 淡出不相关的节点和文字
    nodeGroups.filter(n => !connectedNodeIds.has(n.id))
        .transition()
        .duration(200)
        .style('opacity', 0.2);

    // 淡出不相关的边
    simulationLinks.filter(link =>
        !(link.source.id === d.id || link.target.id === d.id)
    )
        .transition()
        .duration(200)
        .style('opacity', 0.2)
        .style('stroke', '#ccc');

    // 突出显示当前节点
    d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('stroke', '#888')
        .attr('stroke-width', 3);
}

// 鼠标离开处理函数 - 恢复正常显示
function handleMouseOut() {
    // 恢复所有节点和文字的不透明度
    nodeGroups.transition()
        .duration(200)
        .style('opacity', 1);

    // 恢复所有边的样式
    simulationLinks.transition()
        .duration(200)
        .style('opacity', 1)
        .style('stroke', '#c2c2c2');

    // 恢复当前节点的样式
    d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
}

// 每次tick更新位置
simulation.on('tick', ticked)

function ticked() {
    simulationLinks.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

    // 更新节点组位置（同时移动圆和文字）
    nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);

    const padding = 20; // 边距（避免节点贴边）
    const minX = padding;
    const maxX = width - padding;
    const minY = padding;
    const maxY = height - padding;

    nodeGroups.attr("transform", d => {
        // 强制 x 坐标在 [minX, maxX] 之间
        d.x = Math.max(minX, Math.min(maxX, d.x));
        // 强制 y 坐标在 [minY, maxY] 之间
        d.y = Math.max(minY, Math.min(maxY, d.y));
        return `translate(${d.x},${d.y})`;
    });
}

// 1. 定义修改宽高的函数
function resizeSvg(newWidth, newHeight) {
    width = newWidth
    height = newHeight
    // 更新 SVG 容器宽高
    svg.attr("width", newWidth)
        .attr("height", newHeight)
        .attr("viewBox", `0 0 ${newWidth} ${newHeight}`); // 同步视图范围

    // 2. 更新力模拟的中心力（让图重新居中）
    // simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
    simulation.force('x', d3.forceX(width / 2))
        .force('y', d3.forceY(height / 2))

    // 3. 重启模拟，触发重新布局
    simulation.alpha(0.3).restart();
}

window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight - 60;
    resizeSvg(newWidth, newHeight);
});

d3.select('#level-sized').on('change', () => {
    const levelSized = d3.select('#level-sized').property('checked');
    if (!levelSized) {
        svg.selectAll("circle") // 选中所有节点圆
            .filter(d => d.id.startsWith("member_")) // 筛选目标节点
            .attr("r", 5); // 重新设置半径
    } else {
        svg.selectAll("circle") // 选中所有节点圆
            .filter(d => d.id.startsWith("member_")) // 筛选目标节点
            .attr("r", d => (d.level || 1) / 10 + 1); // 重新设置半径
    }
    simulation.nodes(nodes);
    simulation.alpha(0.3).restart();
});
