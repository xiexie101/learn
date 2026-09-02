document.addEventListener('DOMContentLoaded', () => {
    const galleryDom = document.getElementById('character-gallery');
    const chartDom = document.getElementById('graph-container');
    const myChart = echarts.init(chartDom);
    const defaultChartDom = document.getElementById('default-chart');
    const defaultChart = echarts.init(defaultChartDom);
    
    const detailsTitle = document.getElementById('details-title');
    const detailsSubtitle = document.getElementById('details-subtitle');
    const defaultChartContainer = document.getElementById('default-chart');
    const characterDetailContainer = document.getElementById('character-detail');
    
    // Resize listeners
    window.addEventListener('resize', () => {
        myChart.resize();
        defaultChart.resize();
    });

    const getCharTagInfo = (id) => {
        const map = {
            'zhenhuan': { label: '女主', class: 'tag-hero' },
            'emperor': { label: '帝王', class: 'tag-emperor' },
            'empress': { label: '终极反派', class: 'tag-villain' },
            'huafei': { label: '前期反派', class: 'tag-villain' },
            'meizhuang': { label: '挚友', class: 'tag-hero' },
            'anlingrong': { label: '悲剧棋子', class: 'tag-villain' },
            'guojunwang': { label: '真爱', class: 'tag-hero' },
            'wenjian': { label: '守护者', class: 'tag-hero' }
        };
        return map[id] || { label: '后宫', class: 'tag-neutral' };
    };

    const getRelationColor = (relation) => {
        if (relation.includes('敌') || relation.includes('算计') || relation.includes('防备')) return '#953e46'; // Red
        if (relation.includes('爱') || relation.includes('情') || relation.includes('夫妻') || relation.includes('青梅')) return '#d3b070'; // Gold
        return '#499298'; // Teal
    };

    // 模拟出场频率数据
    const frequencyData = {
        'zhenhuan': 26326,
        'emperor': 7597,
        'empress': 3011,
        'huafei': 1624,
        'meizhuang': 1462,
        'anlingrong': 1320,
        'guojunwang': 1113,
        'wenjian': 889
    };

    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            // 1. Render Gallery
            data.nodes.forEach(node => {
                const tagInfo = getCharTagInfo(node.id);
                const card = document.createElement('div');
                card.className = 'char-card';
                card.dataset.id = node.id;
                card.innerHTML = `
                    <img src="${node.still_url}" alt="${node.name}">
                    <div class="name">${node.name}</div>
                    <div class="actor">${node.actor}</div>
                    <div class="tag ${tagInfo.class}">${tagInfo.label}</div>
                `;
                
                card.addEventListener('click', () => {
                    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    showCharacterDetails(node, data.timelines[node.id]);
                    // Highlight node in graph
                    myChart.dispatchAction({ type: 'downplay' });
                    myChart.dispatchAction({ type: 'highlight', dataIndex: data.nodes.findIndex(n => n.id === node.id) });
                });
                galleryDom.appendChild(card);
            });

            // 2. Render Main Graph
            const eNodes = data.nodes.map(node => {
                const isMain = node.id === 'zhenhuan';
                const isSecondary = ['emperor', 'empress', 'huafei'].includes(node.id);
                let symbolSize = 45;
                if (isMain) symbolSize = 70;
                else if (isSecondary) symbolSize = 55;

                return {
                    id: node.id,
                    name: node.name,
                    symbol: `image://${node.still_url}`,
                    symbolSize: symbolSize,
                    itemStyle: {
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 2,
                    },
                    label: {
                        show: true,
                        position: 'bottom',
                        color: '#e0e0e0',
                        fontSize: 12,
                        distance: 8
                    },
                    info: node
                };
            });

            const eLinks = data.links.map(link => ({
                source: link.source,
                target: link.target,
                value: link.relation_name,
                label: {
                    show: false, // 默认隐藏关系文字，hover时显示
                    formatter: '{c}',
                    fontSize: 10,
                    color: '#8a8d93'
                },
                lineStyle: {
                    color: getRelationColor(link.relation_name),
                    width: 1.5,
                    curveness: 0.2,
                    opacity: 0.6
                }
            }));

            myChart.setOption({
                tooltip: {
                    show: true,
                    formatter: (params) => {
                        if (params.dataType === 'edge') {
                            return `${params.data.source} - ${params.data.target} : ${params.data.value}`;
                        }
                        return params.data.name;
                    },
                    backgroundColor: '#12131a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    textStyle: { color: '#e0e0e0' }
                },
                series: [{
                    type: 'graph',
                    layout: 'force',
                    data: eNodes,
                    links: eLinks,
                    roam: true,
                    label: { position: 'right' },
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: { width: 3, opacity: 1 },
                        label: { show: true }
                    },
                    force: {
                        repulsion: 800,
                        edgeLength: [100, 200],
                        gravity: 0.1
                    }
                }]
            });

            myChart.on('click', (params) => {
                if (params.dataType === 'node') {
                    // Update gallery active state
                    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
                    const card = document.querySelector(`.char-card[data-id="${params.data.info.id}"]`);
                    if (card) {
                        card.classList.add('active');
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                    showCharacterDetails(params.data.info, data.timelines[params.data.info.id]);
                }
            });

            // Double click background to reset
            myChart.getZr().on('click', (event) => {
                if (!event.target) {
                    resetToDefaultChart(data.nodes);
                    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
                    myChart.dispatchAction({ type: 'downplay' });
                }
            });

            // 3. Render Default Bar Chart
            renderDefaultChart(data.nodes);

        })
        .catch(console.error);

    function showCharacterDetails(nodeInfo, timelineData) {
        defaultChartContainer.style.display = 'none';
        characterDetailContainer.style.display = 'block';
        
        detailsTitle.textContent = '故事时间线';
        detailsSubtitle.textContent = '线索节点进度 · 按事件发生顺序';

        document.getElementById('detail-img').src = nodeInfo.still_url;
        document.getElementById('detail-name').textContent = nodeInfo.name;
        document.getElementById('detail-actor').textContent = `饰：${nodeInfo.actor || '未知'}`;
        document.getElementById('detail-bio').textContent = nodeInfo.desc;

        const tlDom = document.getElementById('detail-timeline');
        tlDom.innerHTML = '';
        if (timelineData) {
            timelineData.forEach(item => {
                tlDom.innerHTML += `
                    <div class="timeline-item">
                        <div class="tl-date">${item.date}</div>
                        <div class="tl-event">${item.event}</div>
                    </div>
                `;
            });
        }
    }

    function resetToDefaultChart(nodes) {
        characterDetailContainer.style.display = 'none';
        defaultChartContainer.style.display = 'block';
        detailsTitle.textContent = '人物出场概率';
        detailsSubtitle.textContent = '全文提及次数';
    }

    function renderDefaultChart(nodes) {
        // 排序数据
        const sortedData = nodes.map(n => ({
            name: n.name + (n.actor ? ` (${n.actor})` : ''),
            value: frequencyData[n.id] || Math.floor(Math.random() * 500)
        })).sort((a, b) => a.value - b.value); // Bar chart yAxis is bottom-up

        defaultChart.setOption({
            grid: { left: 10, right: 30, top: 10, bottom: 20, containLabel: true },
            xAxis: { 
                type: 'value', 
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                axisLabel: { color: '#8a8d93', fontSize: 10 }
            },
            yAxis: { 
                type: 'category', 
                data: sortedData.map(d => d.name),
                axisLabel: { color: '#e0e0e0', fontSize: 11, fontFamily: 'Noto Serif SC' },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            series: [{
                type: 'bar',
                data: sortedData.map((d, i) => {
                    // Give Zhenhuan a special gold color, others a gradient teal
                    let color = '#499298';
                    if (i === sortedData.length - 1) color = '#d3b070'; // top 1
                    else if (i === sortedData.length - 2) color = '#7c5770'; // top 2
                    return { value: d.value, itemStyle: { color, borderRadius: [0, 4, 4, 0] } };
                }),
                barWidth: 12,
                label: {
                    show: true,
                    position: 'right',
                    color: '#8a8d93',
                    fontSize: 10,
                    formatter: '{c}'
                }
            }]
        });
    }
});
