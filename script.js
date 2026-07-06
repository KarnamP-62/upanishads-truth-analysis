// ==================== SCROLLYTELLING SETUP ====================

// Mobile detection helper
function isMobile() {
    return window.innerWidth <= 768;
}

function isSmallMobile() {
    return window.innerWidth <= 480;
}

// Scroll to section function
window.scrollToSection = function(sectionName) {
    const section = document.getElementById(sectionName + '-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
};

// Update active tab based on current section
function updateActiveTab(sectionId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const tabMap = {
        'intro-section': 0,
        'flowers-section': 1,
        'emotions-section': 2,
        'context-section': 3
    };

    const tabIndex = tabMap[sectionId];
    if (tabIndex !== undefined) {
        document.querySelectorAll('.tab-btn')[tabIndex]?.classList.add('active');
    }

}

// Track which visualizations have been initialized
const vizInitialized = {
    flowers: false,
    emotions: false,
    context: false
};

// Initialize visualization when section comes into view
function initSectionViz(sectionId) {
    if (sectionId === 'flowers-section' && !vizInitialized.flowers) {
        initFlowersViz();
        vizInitialized.flowers = true;
    } else if (sectionId === 'emotions-section' && !vizInitialized.emotions) {
        initEmotionsViz();
        vizInitialized.emotions = true;
    } else if (sectionId === 'context-section' && !vizInitialized.context) {
        initContextViz();
        vizInitialized.context = true;
    }
}

// Set up Intersection Observer for sections
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.scroll-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateActiveTab(entry.target.id);
                // Small delay to ensure container is rendered
                setTimeout(() => {
                    initSectionViz(entry.target.id);
                }, 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px 0px 0px'
    });

    sections.forEach(section => observer.observe(section));

    // Initialize intro as active
    updateActiveTab('intro-section');

    // Handle window resize - reinitialize visualizations
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Clear and reinitialize all visualizations
            if (vizInitialized.flowers) {
                document.getElementById('visualization').innerHTML = '';
                vizInitialized.flowers = false;
                initFlowersViz();
                vizInitialized.flowers = true;
            }
            if (vizInitialized.emotions) {
                document.getElementById('emotions-viz').innerHTML = '';
                vizInitialized.emotions = false;
                initEmotionsViz();
                vizInitialized.emotions = true;
            }
            if (vizInitialized.context) {
                document.getElementById('context-viz').innerHTML = '';
                vizInitialized.context = false;
                initContextViz();
                vizInitialized.context = true;
            }
        }, 300);
    });
});

// ==================== COLOR SCHEMES ====================

// Color scheme for Vedas (petal fill colors)
const vedaColors = {
    "Rigveda": "#DC080B",
    "Yajurveda": "#921400",
    "Samaveda": "#CD5A19",
    "Atharvaveda": "#BC2D12"
};

// Track active tooltip element for touch devices
let activeTooltipElement = null;

// Simple tooltip functions - uses clientX/clientY for fixed positioning
function showTooltipAt(event, html) {
    const tip = document.getElementById('tooltip');
    if (tip) {
        tip.innerHTML = html;
        tip.style.display = 'block';

        // Get coordinates - support both mouse and touch events
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Check if tooltip would go off the bottom of the screen
        const tipHeight = tip.offsetHeight || 150; // estimate if not yet rendered
        const tipWidth = tip.offsetWidth || 200;
        const spaceBelow = window.innerHeight - clientY;
        const spaceRight = window.innerWidth - clientX;

        // Horizontal positioning - keep tooltip on screen
        if (spaceRight < tipWidth + 20) {
            tip.style.left = Math.max(10, clientX - tipWidth - 15) + 'px';
        } else {
            tip.style.left = (clientX + 15) + 'px';
        }

        // Vertical positioning
        if (spaceBelow < tipHeight + 30) {
            // Show tooltip above cursor/touch
            tip.style.top = Math.max(10, clientY - tipHeight - 15) + 'px';
        } else {
            // Show tooltip below cursor/touch
            tip.style.top = (clientY + 15) + 'px';
        }
    }
}

function hideTooltipNow() {
    const tip = document.getElementById('tooltip');
    if (tip) {
        tip.style.display = 'none';
    }
    activeTooltipElement = null;
}

// Touch event handler for tooltips - tap to show, tap elsewhere to hide
function setupTouchTooltip(element, tooltipHtml) {
    element.on('touchstart', function(event) {
        event.preventDefault();
        event.stopPropagation();

        // If tapping the same element, toggle off
        if (activeTooltipElement === this) {
            hideTooltipNow();
            return;
        }

        // Show tooltip for this element
        activeTooltipElement = this;
        showTooltipAt(event, tooltipHtml);
    });
}

// Global touch handler to dismiss tooltip when tapping elsewhere
document.addEventListener('touchstart', function(event) {
    const tip = document.getElementById('tooltip');
    if (tip && tip.style.display === 'block') {
        // Check if tap is outside the tooltip
        if (!tip.contains(event.target) && activeTooltipElement !== event.target) {
            hideTooltipNow();
        }
    }
}, { passive: true });

// Helper function to extract truth words from text
function extractTruthWords(text) {
    const truthTerms = ['truth', 'satya', 'sat', 'tattva', 'tattvas', 'satyam'];
    const foundWords = [];
    const lowerText = text.toLowerCase();

    truthTerms.forEach(term => {
        if (lowerText.includes(term)) {
            foundWords.push(term);
        }
    });

    return foundWords.length > 0 ? foundWords.join(', ') : 'truth';
}


// ==================== EMOTION OVERVIEW DATA ====================
let emotionOverviewData = null;

// Load emotion overview data
d3.json("emotion_overview.json").then(data => {
    emotionOverviewData = data;
    console.log("Emotion overview data loaded");
    // Initialize with Rigveda
    showEmotionBars("Rigveda");
    setupVedaTabs();
}).catch(err => console.log("Could not load emotion overview data:", err));

// Setup Veda tab click handlers
function setupVedaTabs() {
    document.querySelectorAll('.veda-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.veda-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Show bars for selected Veda
            showEmotionBars(this.getAttribute('data-veda'));
        });
    });
}

// Show emotion bars for a Veda
function showEmotionBars(vedaName) {
    if (!emotionOverviewData || !emotionOverviewData[vedaName]) return;

    const emotions = emotionOverviewData[vedaName];
    const container = document.getElementById('emotion-bars-container');

    // Lavender colors for emotion section
    const emotionVedaColors = {
        "Rigveda": "#920E40",
        "Yajurveda": "#9E477D",
        "Samaveda": "#B35CA6",
        "Atharvaveda": "#D082D5"
    };
    const vedaColor = emotionVedaColors[vedaName] || "#9E477D";

    if (!container) return;

    const maxPercentage = Math.max(...emotions.map(e => e.percentage));

    let html = '';
    emotions.forEach(item => {
        const barWidth = (item.percentage / maxPercentage) * 100;
        html += `
            <div class="emotion-bar-item">
                <span class="emotion-bar-label">${item.emotion}</span>
                <div class="emotion-bar-wrapper">
                    <div class="emotion-bar" style="width: ${barWidth}%; background: ${vedaColor};"></div>
                </div>
                <span class="emotion-bar-value">${item.percentage}%</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== TOP WORDS DATA ====================
let topWordsData = null;

// Load top words data
d3.json("top_words.json").then(data => {
    topWordsData = data;
    console.log("Top words data loaded");
    showWordsBars("Rigveda");
    setupWordsTabs();
}).catch(err => console.log("Could not load top words data:", err));

// Setup Words tab click handlers
function setupWordsTabs() {
    document.querySelectorAll('.words-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.words-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Show bars for selected Veda
            showWordsBars(this.getAttribute('data-veda'));
        });
    });
}

// Show words bars for a Veda
function showWordsBars(vedaName) {
    if (!topWordsData || !topWordsData[vedaName]) return;

    const words = topWordsData[vedaName];
    const container = document.getElementById('words-bars-container');

    // Orange colors for Truth Flowers section
    const wordsVedaColors = {
        "Rigveda": "#DC080B",
        "Yajurveda": "#921400",
        "Samaveda": "#CD5A19",
        "Atharvaveda": "#BC2D12"
    };
    const vedaColor = wordsVedaColors[vedaName] || "#CD5A19";

    if (!container) return;

    const maxFrequency = Math.max(...words.map(w => w.frequency));

    let html = '';
    words.forEach(item => {
        const barWidth = (item.frequency / maxFrequency) * 100;
        html += `
            <div class="words-bar-item">
                <span class="words-bar-label">${item.word}</span>
                <div class="words-bar-wrapper">
                    <div class="words-bar" style="width: ${barWidth}%; background: ${vedaColor};"></div>
                </div>
                <span class="words-bar-value">${item.frequency}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== CONTEXT OVERVIEW DATA ====================
let contextOverviewData = null;

// Load context overview data
d3.json("context_overview.json").then(data => {
    contextOverviewData = data;
    console.log("Context overview data loaded");
    showContextBars("Rigveda");
    setupContextTabs();
}).catch(err => console.log("Could not load context overview data:", err));

// Setup Context tab click handlers
function setupContextTabs() {
    document.querySelectorAll('.context-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.context-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Show bars for selected Veda
            showContextBars(this.getAttribute('data-veda'));
        });
    });
}

// Show context bars for a Veda
function showContextBars(vedaName) {
    if (!contextOverviewData || !contextOverviewData[vedaName]) return;

    const contexts = contextOverviewData[vedaName];
    const container = document.getElementById('context-bars-container');

    // Single color for context section
    const vedaColor = "#B5204B";

    if (!container) return;

    const maxPercentage = Math.max(...contexts.map(c => c.percentage));

    let html = '';
    contexts.forEach(item => {
        const barWidth = (item.percentage / maxPercentage) * 100;
        html += `
            <div class="context-bar-item">
                <span class="context-bar-label">${item.context}</span>
                <div class="context-bar-wrapper">
                    <div class="context-bar" style="width: ${barWidth}%; background: ${vedaColor};"></div>
                </div>
                <span class="context-bar-value">${item.percentage}%</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== TRUTH FLOWERS VISUALIZATION ====================

function initFlowersViz() {
    const container = document.getElementById('visualization');
    const containerRect = container.getBoundingClientRect();

    // Responsive dimensions based on screen size
    let width, height;
    if (isMobile()) {
        // On mobile, use full container width
        width = Math.max(containerRect.width, window.innerWidth * 0.95);
        height = Math.max(containerRect.height, window.innerHeight * 0.55, 300);
    } else {
        // Desktop: use larger dimensions
        width = Math.max(containerRect.width, 600, window.innerWidth * 0.55);
        height = Math.max(containerRect.height, 500, window.innerHeight * 0.7);
    }
    const radius = Math.min(width, height) * (isMobile() ? 0.65 : 0.7);

    console.log('Initializing Truth Flowers:', width, height, 'Mobile:', isMobile());

    // Create SVG with viewBox for responsiveness
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMid meet")
        .append("g")
        .attr("transform", `translate(${width * 0.45}, ${height / 2})`);

    // Zoom disabled - visualization is static

    // Tree layout with more space between different Vedas
    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => {
            if (a.parent === b.parent) {
                return 1 / a.depth;
            }
            if (a.depth === 1) return 4;
            if (a.depth === 2) return 3;
            return 2 / a.depth;
        });

    // Calculate max sentences for scaling
    let maxSentences = 1;

    // Load and render data
    d3.json("data.json").then(data => {
        const root = d3.hierarchy(data);

        // Find max sentence count for scaling
        root.descendants().forEach(d => {
            if (d.data.sentence_count) {
                maxSentences = Math.max(maxSentences, d.data.sentence_count);
            }
        });

        update(root);

        function update(source) {
            const duration = 750;

            // Compute the new tree layout
            tree(root);

            // Force each Veda into its own section with gaps
            const vedaSections = {
                "Rigveda": { start: 5.8, end: 6.1 },
                "Yajurveda": { start: 0.0, end: 3.2 },
                "Atharvaveda": { start: 3.4, end: 4.5 },
                "Samaveda": { start: 4.7, end: 5.6 }
            };

            // Position Vedas and their Upanishads in sections
            root.children?.forEach(vedaNode => {
                const section = vedaSections[vedaNode.data.name];
                if (!section) return;

                vedaNode.x = (section.start + section.end) / 2;

                const children = vedaNode.children || [];
                if (children.length > 0) {
                    const range = section.end - section.start;
                    const padding = range * 0.02;

                    let orderedChildren = [...children];
                    if (vedaNode.data.name === "Yajurveda") {
                        const taittiriyaIdx = orderedChildren.findIndex(c =>
                            c.data.name === "Taittiriya Upanishad"
                        );
                        if (taittiriyaIdx !== -1) {
                            const taittiriya = orderedChildren.splice(taittiriyaIdx, 1)[0];
                            const middleIdx = Math.floor(orderedChildren.length / 2);
                            orderedChildren.splice(middleIdx, 0, taittiriya);
                        }

                        const narayanaIdx = orderedChildren.findIndex(c =>
                            c.data.name === "Narayana Upanishad"
                        );
                        const nineteenIdx = orderedChildren.findIndex(c =>
                            c.data.name === "Nineteen Upanishad"
                        );
                        if (narayanaIdx !== -1 && nineteenIdx !== -1) {
                            const temp = orderedChildren[narayanaIdx];
                            orderedChildren[narayanaIdx] = orderedChildren[nineteenIdx];
                            orderedChildren[nineteenIdx] = temp;
                        }
                    }

                    orderedChildren.forEach((upanishad, i) => {
                        const step = children.length > 1
                            ? (range - padding * 2) / (children.length - 1)
                            : 0;
                        upanishad.x = section.start + padding + (i * step);
                    });
                }
            });

            // Customize radius based on sentence count
            const minRadius = radius * 0.2;
            const maxRadius = radius;

            const vedaChildIndex = {};

            root.descendants().forEach(d => {
                if (d.depth === 0) {
                    d.y = 0;
                } else if (d.depth === 1) {
                    d.y = minRadius;
                    vedaChildIndex[d.data.name] = 0;
                } else if (d.depth === 2) {
                    const vedaName = d.parent.data.name;
                    const idx = vedaChildIndex[vedaName]++;
                    const isOuter = idx % 2 === 0;

                    const sentenceCount = d.data.sentence_count || 1;
                    const baseRadius = minRadius + (radius * 0.15) + (sentenceCount / maxSentences) * (maxRadius - minRadius - radius * 0.35);

                    const rowOffset = isOuter ? radius * 0.12 : 0;
                    d.y = baseRadius + rowOffset;
                } else if (d.depth === 3) {
                    const parentRadius = d.parent.y;
                    d.y = parentRadius + (radius * 0.08);
                }
            });

            const nodes = root.descendants();
            const links = root.links();

            // Update links
            const link = svg.selectAll(".link")
                .data(links, d => d.target.data.name);

            const linkEnter = link.enter()
                .filter(d => d.target.depth !== 3)
                .append("path")
                .attr("class", "link")
                .attr("d", d => {
                    const o = { x: source.x0 || source.x, y: source.y0 || source.y };
                    return radialLine(o, o);
                })
                .attr("stroke", d => d.target.depth === 1 ? "#2A3F01" : "#526B0B");

            link.merge(linkEnter)
                .transition()
                .duration(duration)
                .attr("d", d => radialLine(d.source, d.target));

            link.exit()
                .transition()
                .duration(duration)
                .attr("d", d => {
                    const o = { x: source.x, y: source.y };
                    return radialLine(o, o);
                })
                .remove();

            // Update nodes
            const node = svg.selectAll(".node")
                .data(nodes, d => d.data.name);

            const nodeEnter = node.enter()
                .append("g")
                .attr("class", d => `node depth-${d.depth}`)
                .attr("transform", d => {
                    const x0 = source.x0 || source.x;
                    const y0 = source.y0 || source.y;
                    return `rotate(${x0 * 180 / Math.PI - 90}) translate(${y0}, 0)`;
                })
                .on("mouseover", (event, d) => showNodeTooltip(event, d))
                .on("mouseout", () => hideTooltipNow());

            // Add small dots at Veda nodes (depth 1) with respective Veda colors
            svg.selectAll(".node").filter(d => d.depth === 1)
                .each(function(d) {
                    d3.select(this).selectAll(".veda-dot").remove();
                    const vedaDotColor = vedaColors[d.data.name] || "#2A3F01";
                    d3.select(this).append("circle")
                        .attr("class", "veda-dot")
                        .attr("r", radius * 0.012)
                        .attr("fill", vedaDotColor)
                        .attr("stroke", "none");
                });

            // Add diamond center and fanned petals at Upanishad nodes (depth 2)
            svg.selectAll(".node").filter(d => d.depth === 2)
                .each(function(d) {
                    d3.select(this).selectAll(".petal, .center-circle").remove();

                    const group = d3.select(this);
                    const diamondSize = radius * 0.008;

                    const children = d.children || [];
                    const numPetals = children.length;

                    if (numPetals > 0) {
                        const petalLength = radius * 0.07;
                        const petalWidth = radius * 0.018;
                        const fanAngle = numPetals > 8
                            ? Math.PI * 2 * (1 - 1/numPetals)
                            : Math.min(Math.PI * 0.9, numPetals * 0.2);
                        const startAngle = -fanAngle / 2;

                        children.forEach((child, i) => {
                            const angle = numPetals > 1
                                ? startAngle + (i / (numPetals - 1)) * fanAngle
                                : 0;

                            const upanishadName = d.data.name;
                            const vedaName = d.parent ? d.parent.data.name : '';
                            const truthWord = child.data.words_found;
                            const sentence = child.data.full_sentence || child.data.name;

                            const tooltipContent = `<h3>${upanishadName}</h3>
                                         <p><strong>Veda:</strong> ${vedaName}</p>
                                         <p><strong>Truth Word:</strong> <span class="truth-word">${truthWord}</span></p>
                                         <p>${sentence}</p>`;

                            const petal = group.append("path")
                                .attr("class", "petal")
                                .attr("d", `M ${diamondSize},0
                                    C ${diamondSize + petalLength * 0.25},${petalWidth * 0.5} ${diamondSize + petalLength * 0.5},${petalWidth} ${diamondSize + petalLength * 0.75},${petalWidth * 0.7}
                                    Q ${diamondSize + petalLength * 0.95},${petalWidth * 0.3} ${diamondSize + petalLength},0
                                    Q ${diamondSize + petalLength * 0.95},${-petalWidth * 0.3} ${diamondSize + petalLength * 0.75},${-petalWidth * 0.7}
                                    C ${diamondSize + petalLength * 0.5},${-petalWidth} ${diamondSize + petalLength * 0.25},${-petalWidth * 0.5} ${diamondSize},0`)
                                .attr("transform", `rotate(${angle * 180 / Math.PI})`)
                                .attr("fill", getNodeColor(d))
                                .attr("stroke", "#FCB71C")
                                .attr("stroke-width", radius * 0.001)
                                .attr("opacity", 0.85)
                                .on("mouseover", function(event) {
                                    d3.select(this).attr("opacity", 1).attr("stroke-width", radius * 0.003);
                                    showTooltipAt(event, tooltipContent);
                                })
                                .on("mouseout", function() {
                                    d3.select(this).attr("opacity", 0.85).attr("stroke-width", radius * 0.001);
                                    hideTooltipNow();
                                })
                                .on("mousemove", function(event) {
                                    showTooltipAt(event, tooltipContent);
                                })
                                .on("touchstart", function(event) {
                                    event.preventDefault();
                                    if (activeTooltipElement === this) {
                                        hideTooltipNow();
                                        d3.select(this).attr("opacity", 0.85).attr("stroke-width", radius * 0.001);
                                    } else {
                                        // Reset previous active element
                                        if (activeTooltipElement) {
                                            d3.select(activeTooltipElement).attr("opacity", 0.85);
                                        }
                                        activeTooltipElement = this;
                                        d3.select(this).attr("opacity", 1).attr("stroke-width", radius * 0.003);
                                        showTooltipAt(event, tooltipContent);
                                    }
                                });

                        });
                    }

                    group.append("circle")
                        .attr("class", "center-circle")
                        .attr("r", diamondSize)
                        .attr("fill", "#B8952E")
                        .attr("stroke", "none");
                });

            // Update node positions
            node.merge(nodeEnter)
                .transition()
                .duration(duration)
                .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`);

            // Remove exiting nodes
            node.exit()
                .transition()
                .duration(duration)
                .attr("transform", d => `rotate(${source.x * 180 / Math.PI - 90}) translate(${source.y}, 0)`)
                .remove();

            // Store positions for transitions
            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        function radialLine(source, target) {
            const sourceX = source.y * Math.cos(source.x - Math.PI / 2);
            const sourceY = source.y * Math.sin(source.x - Math.PI / 2);
            const targetX = target.y * Math.cos(target.x - Math.PI / 2);
            const targetY = target.y * Math.sin(target.x - Math.PI / 2);
            return `M${sourceX},${sourceY}L${targetX},${targetY}`;
        }

        function getNodeColor(d) {
            if (d.depth === 0) return "#e8d5b7";
            if (d.depth === 1) return vedaColors[d.data.name];
            let node = d;
            while (node.depth > 1) node = node.parent;
            return vedaColors[node.data.name];
        }

        // Node tooltip for non-petal elements
        function showNodeTooltip(event, d) {
            let content = "";
            if (d.depth === 0) {
                content = `<h3>${d.data.name}</h3><p>Total Vedas: 4</p>`;
            } else if (d.depth === 1) {
                content = `<h3>${d.data.name}</h3><p>Upanishads: ${d.data.upanishad_count}</p><p>Truth Sentences: ${d.data.sentence_count}</p>`;
            } else if (d.depth === 2) {
                content = `<h3>${d.data.name}</h3><p>Sentences: ${d.data.sentence_count}</p>`;
            }
            showTooltipAt(event, content);
        }

    });
}

// ==================== EMOTIONS VISUALIZATION ====================

function initEmotionsViz() {
    const container = document.getElementById('emotions-viz');
    const containerRect = container.getBoundingClientRect();

    // Responsive dimensions based on screen size
    let eWidth, eHeight;
    if (isMobile()) {
        // On mobile, use full width and adjust height
        eWidth = Math.max(containerRect.width, window.innerWidth * 0.95);
        eHeight = Math.max(containerRect.height, window.innerHeight * 0.55, 320);
    } else {
        // Desktop
        eWidth = Math.max(containerRect.width, window.innerWidth * 0.65);
        eHeight = Math.max(containerRect.height, window.innerHeight * 0.85);
    }

    console.log('Initializing Emotions:', eWidth, eHeight, 'Mobile:', isMobile());

    const emotionColors = {
        "reverence": "#E8A87C",
        "unity": "#C38D9E",
        "bliss": "#FFD700",
        "transcendence": "#DDA0DD",
        "devotion": "#FF6B6B",
        "liberation": "#98D8C8",
        "peace": "#87CEEB",
        "detachment": "#B8860B",
        "wonder": "#FF69B4",
        "awe": "#9370DB",
        "serenity": "#20B2AA",
        "understanding": "#FFA07A",
        "wisdom": "#DAA520",
        "enlightenment": "#FFE66D",
        "confusion": "#708090",
        "fear": "#696969",
        "determination": "#CD853F",
        "longing": "#BC8F8F"
    };

    const emotionsSvg = d3.select("#emotions-viz")
        .append("svg")
        .attr("width", eWidth)
        .attr("height", eHeight);

    d3.json("emotions_data.json").then(data => {
        const categories = data.children;
        // Center plants within the container with balanced spacing
        const leftPadding = eWidth * 0.1;
        const usableWidth = eWidth * 0.8;
        const plantSpacing = usableWidth / (categories.length - 1);
        const groundY = eHeight * 0.88;

        let maxEmotionSentences = 0;
        categories.forEach(cat => {
            cat.children.forEach(emotion => {
                const count = (emotion.sentences || []).length;
                if (count > maxEmotionSentences) maxEmotionSentences = count;
            });
        });

        const stemWidth = eWidth * 0.003;

        categories.forEach((category, catIdx) => {
            const plantX = leftPadding + plantSpacing * catIdx;
            const stemColor = "#565320";
            const baseY = groundY - 10;

            const emotions = category.children;
            const totalBranches = emotions.length;
            const spreadWidth = eWidth * 0.04 + totalBranches * eWidth * 0.02;

            emotions.forEach((emotion, emIdx) => {
                const leafColor = emotionColors[emotion.name] || "#90EE90";

                const sentences = emotion.sentences || [];
                const sentenceCount = sentences.length;
                const petalSpacing = eHeight * 0.012;
                const minBranchHeight = eHeight * 0.04;
                const branchHeight = Math.max(minBranchHeight, sentenceCount * petalSpacing);

                const branchTopX = plantX + (emIdx - (totalBranches - 1) / 2) * (spreadWidth / Math.max(totalBranches - 1, 1));
                const branchTopY = baseY - branchHeight;

                const curveHeight = eHeight * 0.08 + emIdx * eHeight * 0.012;
                const ctrlX = branchTopX;
                const ctrlY = baseY - Math.min(curveHeight, branchHeight * 0.3);

                const waveAmount = eWidth * 0.008 + Math.random() * eWidth * 0.006;
                const waveDirection = emIdx % 2 === 0 ? 1 : -1;
                const midY1 = ctrlY - (ctrlY - branchTopY) * 0.33;
                const midY2 = ctrlY - (ctrlY - branchTopY) * 0.66;

                const branchDirection = branchTopX > plantX ? 1 : -1;
                const curveOutX = branchTopX + branchDirection * 12;

                emotionsSvg.append("path")
                    .attr("d", `M ${plantX} ${baseY}
                                Q ${curveOutX} ${baseY - 20} ${branchTopX} ${ctrlY}
                                C ${branchTopX + waveAmount * waveDirection} ${midY1}
                                  ${branchTopX - waveAmount * waveDirection * 0.5} ${midY2}
                                  ${branchTopX} ${branchTopY}`)
                    .attr("stroke", stemColor)
                    .attr("stroke-width", stemWidth)
                    .attr("stroke-linecap", "round")
                    .attr("fill", "none");

                const nodeRadius = eWidth * 0.006;
                emotionsSvg.append("circle")
                    .attr("cx", branchTopX)
                    .attr("cy", ctrlY)
                    .attr("r", nodeRadius)
                    .attr("fill", "#2A3F01")
                    .attr("stroke", "#2A3F01")
                    .attr("stroke-width", eWidth * 0.0015)
                    .style("cursor", "pointer")
                    .on("mouseover", function(event) {
                        d3.select(this).attr("r", nodeRadius * 1.3);
                        showTooltipAt(event, `<h3>${emotion.name}</h3><p>Category: ${category.name}</p><p>Count: ${emotion.count} sentences</p>`);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("r", nodeRadius);
                        hideTooltipNow();
                    })
                    .on("mousemove", function(event) {
                        showTooltipAt(event, `<h3>${emotion.name}</h3><p>Category: ${category.name}</p><p>Count: ${emotion.count} sentences</p>`);
                    });

                const lineBottom = ctrlY;
                const lineTop = branchTopY;
                const lineHeight = lineBottom - lineTop;

                const vedaPetalColors = {
                    "Rigveda": "#920E40",
                    "Yajurveda": "#9E477D",
                    "Samaveda": "#B35CA6",
                    "Atharvaveda": "#D082D5"
                };

                const sortedSentences = [...sentences].sort((a, b) => (a.score || 0) - (b.score || 0));
                const totalSentences = sortedSentences.length;

                sortedSentences.forEach((sentence, sIdx) => {
                    const score = sentence.score || 0;
                    let dropY, horizontalOffset;

                    if (totalSentences <= 2) {
                        dropY = lineTop + 5;
                        horizontalOffset = totalSentences === 1 ? 0 : (sIdx === 0 ? -2 : 2);
                    } else {
                        const padding = eHeight * 0.02;
                        const availableHeight = lineHeight - padding * 2;
                        const petalGap = availableHeight / (totalSentences - 1);
                        dropY = lineBottom - padding - (sIdx * petalGap);
                        horizontalOffset = 0;
                    }
                    const dropHeight = eHeight * 0.045;
                    const dropWidth = eWidth * 0.012;

                    const petalColor = vedaPetalColors[sentence.veda] || leafColor;

                    const direction = sIdx % 2 === 0 ? 1 : -1;
                    const offsetX = direction * 2;

                    const petalCenterX = branchTopX + (horizontalOffset || 0);

                    const petalPath = `M ${petalCenterX} ${dropY}
                        C ${petalCenterX + offsetX + dropWidth * direction} ${dropY - dropHeight * 0.3}
                          ${petalCenterX + offsetX + dropWidth * 1.2 * direction} ${dropY - dropHeight * 0.6}
                          ${petalCenterX + offsetX + dropWidth * 0.8 * direction} ${dropY - dropHeight}
                        Q ${petalCenterX + offsetX} ${dropY - dropHeight * 1.1}
                          ${petalCenterX + offsetX - dropWidth * 0.3 * direction} ${dropY - dropHeight}
                        C ${petalCenterX + offsetX - dropWidth * 0.5 * direction} ${dropY - dropHeight * 0.6}
                          ${petalCenterX + offsetX - dropWidth * 0.3 * direction} ${dropY - dropHeight * 0.3}
                          ${petalCenterX} ${dropY}`;

                    const rotateAngle = totalSentences <= 2 ? (sIdx === 0 ? -45 : 45) : direction * 35;

                    const emotionTruthWord = extractTruthWords(sentence.text);
                    const emotionTooltipContent = `<h3>${emotion.name}</h3>
                                       <p><strong>Veda:</strong> ${sentence.veda}</p>
                                       <p><strong>Sentiment Score:</strong> ${score.toFixed(2)}</p>
                                       <p><strong>Truth Word:</strong> <span class="truth-word">${emotionTruthWord}</span></p>
                                       <p>${sentence.text}</p>`;

                    emotionsSvg.append("path")
                        .attr("d", petalPath)
                        .attr("fill", petalColor)
                        .attr("stroke", stemColor)
                        .attr("stroke-width", 0.5)
                        .attr("opacity", 0.85)
                        .attr("transform", `rotate(${rotateAngle}, ${petalCenterX}, ${dropY})`)
                        .style("cursor", "pointer")
                        .on("mouseover", function(event) {
                            d3.select(this).attr("opacity", 1).attr("stroke-width", 1.5);
                            showTooltipAt(event, emotionTooltipContent);
                        })
                        .on("mouseout", function() {
                            d3.select(this).attr("opacity", 0.85).attr("stroke-width", 0.5);
                            hideTooltipNow();
                        })
                        .on("mousemove", function(event) {
                            showTooltipAt(event, emotionTooltipContent);
                        })
                        .on("touchstart", function(event) {
                            event.preventDefault();
                            if (activeTooltipElement === this) {
                                hideTooltipNow();
                                d3.select(this).attr("opacity", 0.85).attr("stroke-width", 0.5);
                            } else {
                                if (activeTooltipElement) {
                                    d3.select(activeTooltipElement).attr("opacity", 0.85);
                                }
                                activeTooltipElement = this;
                                d3.select(this).attr("opacity", 1).attr("stroke-width", 1.5);
                                showTooltipAt(event, emotionTooltipContent);
                            }
                        });
                });
            });

            emotionsSvg.append("line")
                .attr("x1", plantX)
                .attr("y1", baseY)
                .attr("x2", plantX)
                .attr("y2", baseY + eHeight * 0.05)
                .attr("stroke", stemColor)
                .attr("stroke-width", stemWidth)
                .attr("stroke-linecap", "round");

            emotionsSvg.append("text")
                .attr("x", plantX)
                .attr("y", groundY + eHeight * 0.08)
                .attr("text-anchor", "middle")
                .attr("font-size", `${eWidth * 0.012}px`)
                .attr("font-weight", "bold")
                .attr("fill", "#333")
                .text(category.name);

            emotionsSvg.append("text")
                .attr("x", plantX)
                .attr("y", groundY + eHeight * 0.1)
                .attr("text-anchor", "middle")
                .attr("font-size", `${eWidth * 0.009}px`)
                .attr("fill", "#666")
                .text(`(${category.count} sentences)`);
        });
    }).catch(error => {
        console.error("Error loading emotions data:", error);
        container.innerHTML = `<div style="color: red; padding: 2rem;">Error loading emotions data: ${error}</div>`;
    });
}

// ==================== PHILOSOPHICAL CONTEXT VISUALIZATION ====================

function initContextViz() {
    const container = document.getElementById('context-viz');
    const containerRect = container.getBoundingClientRect();

    // Responsive dimensions based on screen size
    let cWidth, cHeight;
    if (isMobile()) {
        // On mobile, use full width and adjust height
        cWidth = Math.max(containerRect.width, window.innerWidth * 0.95);
        cHeight = Math.max(containerRect.height, window.innerHeight * 0.55, 320);
    } else {
        // Desktop
        cWidth = Math.max(containerRect.width, window.innerWidth * 0.65);
        cHeight = Math.max(containerRect.height, window.innerHeight * 0.85);
    }

    console.log('Initializing Context:', cWidth, cHeight, 'Mobile:', isMobile());

    const contextVedaColors = {
        "Rigveda": "#DC080B",
        "Yajurveda": "#921400",
        "Samaveda": "#CD5A19",
        "Atharvaveda": "#BC2D12"
    };
    const vedaOrder = ["Rigveda", "Yajurveda", "Samaveda", "Atharvaveda"];

    const contextSvg = d3.select("#context-viz")
        .append("svg")
        .attr("width", cWidth)
        .attr("height", cHeight);

    d3.json("context_data.json").then(data => {
        const contexts = data.children;
        const stemColor = "#2d5a27";
        const stemWidth = cWidth * 0.003;
        const pondBottom = cHeight * 0.92;

        const lotusPositions = [
            { x: cWidth * 0.12, y: cHeight * 0.68, scale: 1.3 },   // Liberation & Freedom
            { x: cWidth * 0.28, y: cHeight * 0.42, scale: 1.5 },   // Cosmic Elements - moved right
            { x: cWidth * 0.32, y: cHeight * 0.75, scale: 1.6 },   // Knowledge & Wisdom
            { x: cWidth * 0.52, y: cHeight * 0.35, scale: 1.45 },  // Sacred Utterances - moved right
            { x: cWidth * 0.50, y: cHeight * 0.68, scale: 1.55 },  // Self-Realization
            { x: cWidth * 0.78, y: cHeight * 0.38, scale: 1.5 },   // Teacher-Student - moved right
            { x: cWidth * 0.68, y: cHeight * 0.68, scale: 1.4 },   // Brahman Identity
            { x: cWidth * 0.78, y: cHeight * 0.65, scale: 1.3 }    // Ethical Foundation
        ];

        const maxContextCount = Math.max(...contexts.map(c => c.count || 0));

        contexts.forEach((context, ctxIdx) => {
            if (ctxIdx >= lotusPositions.length) return;

            const pos = lotusPositions[ctxIdx];
            const lotusX = pos.x;
            const lotusY = pos.y;
            const contextRatio = (context.count || 0) / maxContextCount;
            const scale = pos.scale * (0.5 + contextRatio * 0.5) * 1.1;  // 10% larger

            const vedaCounts = {};
            vedaOrder.forEach(v => vedaCounts[v] = 0);
            (context.sentences || []).forEach(s => {
                if (vedaCounts[s.veda] !== undefined) {
                    vedaCounts[s.veda]++;
                }
            });

            const maxCount = Math.max(...Object.values(vedaCounts), 1);

            const stemBaseX = lotusX + (Math.random() - 0.5) * cWidth * 0.03;
            const curveDirection = lotusX < cWidth / 2 ? 1 : -1;
            const curveAmount = cWidth * 0.02 + Math.random() * cWidth * 0.015;

            contextSvg.append("path")
                .attr("d", `M ${stemBaseX} ${pondBottom}
                            Q ${stemBaseX + curveDirection * curveAmount} ${(pondBottom + lotusY) / 2}
                              ${lotusX} ${lotusY}`)
                .attr("stroke", stemColor)
                .attr("stroke-width", stemWidth)
                .attr("stroke-linecap", "round")
                .attr("fill", "none");

            const lotusGroup = contextSvg.append("g")
                .attr("class", "lotus")
                .style("cursor", "pointer");

            const sortedVedas = [...vedaOrder].map((veda, idx) => ({
                veda,
                count: vedaCounts[veda],
                originalIdx: idx
            })).sort((a, b) => b.count - a.count);

            sortedVedas.forEach(({ veda, count, originalIdx }) => {
                const petalIdx = originalIdx;

                // Get sentences for this veda to calculate line spread
                const vedaSentences = (context.sentences || []).filter(s => s.veda === veda);
                const totalLines = vedaSentences.length;

                // Skip if no sentences
                if (totalLines === 0) return;

                // Fixed gap between lines
                const fixedGap = cWidth * 0.0055;
                const totalSpread = (totalLines - 1) * fixedGap;

                // Petal width smaller than line spread - bezier will bulge to match lines
                const petalWidth = totalSpread * 0.65 * scale;

                // Petal height proportional
                const minSize = cHeight * 0.02;
                const maxSize = cHeight * 0.25;
                const sizeRatio = count / Math.max(maxCount, 1);
                let petalHeight = (minSize + sizeRatio * (maxSize - minSize)) * scale;

                // Reduce Yajurveda petal height in Self Realization, Liberation & Freedom, and Ethical Foundation
                if (veda === "Yajurveda" &&
                    (context.name === "Self-Realization" || context.name === "Liberation & Freedom" || context.name === "Ethical Foundation")) {
                    petalHeight = petalHeight * 0.65;
                }

                // Reduce Atharvaveda petal height in Self-Realization, Ethical Foundation, and Liberation & Freedom
                if (veda === "Atharvaveda" &&
                    (context.name === "Self-Realization" || context.name === "Ethical Foundation" || context.name === "Liberation & Freedom")) {
                    petalHeight = petalHeight * 0.65;
                }

                // Reduce Samaveda petal height in Self-Realization
                if (veda === "Samaveda" && context.name === "Self-Realization") {
                    petalHeight = petalHeight * 0.65;
                }

                // Reduce Rigveda petal height in Self-Realization to match Teacher-Student Transmission
                if (veda === "Rigveda" && context.name === "Self-Realization") {
                    petalHeight = petalHeight * 0.75;
                }

                // Reduce all petals in Sacred Utterances
                if (context.name === "Sacred Utterances") {
                    petalHeight = petalHeight * 0.75;
                }

                const petalAngles = [-150, -115, -65, -30];
                const angle = petalAngles[petalIdx];

                const petalBaseX = lotusX;
                const petalBaseY = lotusY;

                const petalGroup = lotusGroup.append("g")
                    .attr("transform", `rotate(${angle + 90}, ${petalBaseX}, ${petalBaseY})`);

                const petalPath = `M ${petalBaseX} ${petalBaseY}
                    C ${petalBaseX - petalWidth * 0.5} ${petalBaseY - petalHeight * 0.3}
                      ${petalBaseX - petalWidth * 0.5} ${petalBaseY - petalHeight * 0.7}
                      ${petalBaseX} ${petalBaseY - petalHeight}
                    C ${petalBaseX + petalWidth * 0.5} ${petalBaseY - petalHeight * 0.7}
                      ${petalBaseX + petalWidth * 0.5} ${petalBaseY - petalHeight * 0.3}
                      ${petalBaseX} ${petalBaseY}`;

                petalGroup.append("path")
                    .attr("d", petalPath)
                    .attr("fill", "#F3DFE2")
                    .attr("stroke", "none")
                    .attr("opacity", 0.9)
                    .style("pointer-events", "none");

                const basePointX = petalBaseX;
                const basePointY = petalBaseY;
                const tipPointX = petalBaseX;
                const tipPointY = petalBaseY - petalHeight;

                const sortedSentences = [...vedaSentences].sort((a, b) => a.score - b.score);
                const startOffset = -totalSpread / 2;

                sortedSentences.forEach((sentence, sIdx) => {
                    const lineThickness = 0.5 + sentence.score * 2;
                    const bulgeX = startOffset + (sIdx * fixedGap);

                    const ctrl1X = petalBaseX + bulgeX;
                    const ctrl1Y = petalBaseY - petalHeight * 0.35;
                    const ctrl2X = petalBaseX + bulgeX;
                    const ctrl2Y = petalBaseY - petalHeight * 0.65;

                    const score = sentence.score;
                    let lineColor;
                    // Three categories: Low (<0.5), Medium (0.5-0.8), High (>0.8)
                    if (score < 0.5) {
                        lineColor = "#E39098";  // Low
                    } else if (score <= 0.8) {
                        lineColor = "#D55971";  // Medium
                    } else {
                        lineColor = "#B91645";  // High
                    }

                    const originalStrokeWidth = Math.max(lineThickness, 1);
                    const hoverStrokeWidth = originalStrokeWidth + 2;

                    const contextTruthWord = extractTruthWords(sentence.text);
                    const contextTooltipContent = `<h3>${context.name}</h3>
                                       <p><strong>Veda:</strong> ${veda}</p>
                                       <p><strong>Context Score:</strong> ${sentence.score.toFixed(2)}</p>
                                       <p><strong>Truth Word:</strong> <span class="truth-word">${contextTruthWord}</span></p>
                                       <p>${sentence.text}</p>`;

                    petalGroup.append("path")
                        .attr("d", `M ${basePointX} ${basePointY}
                                    C ${ctrl1X} ${ctrl1Y}
                                      ${ctrl2X} ${ctrl2Y}
                                      ${tipPointX} ${tipPointY}`)
                        .attr("stroke", lineColor)
                        .attr("stroke-width", originalStrokeWidth)
                        .attr("stroke-linecap", "round")
                        .attr("fill", "none")
                        .attr("opacity", 0.7)
                        .style("cursor", "pointer")
                        .style("pointer-events", "stroke")
                        .on("mouseover", function(event) {
                            d3.select(this).attr("opacity", 1).attr("stroke-width", hoverStrokeWidth);
                            showTooltipAt(event, contextTooltipContent);
                        })
                        .on("mouseout", function() {
                            d3.select(this).attr("opacity", 0.7).attr("stroke-width", originalStrokeWidth);
                            hideTooltipNow();
                        })
                        .on("mousemove", function(event) {
                            showTooltipAt(event, contextTooltipContent);
                        })
                        .on("touchstart", function(event) {
                            event.preventDefault();
                            if (activeTooltipElement === this) {
                                hideTooltipNow();
                                d3.select(this).attr("opacity", 0.7).attr("stroke-width", originalStrokeWidth);
                            } else {
                                if (activeTooltipElement) {
                                    d3.select(activeTooltipElement).attr("opacity", 0.7);
                                }
                                activeTooltipElement = this;
                                d3.select(this).attr("opacity", 1).attr("stroke-width", hoverStrokeWidth);
                                showTooltipAt(event, contextTooltipContent);
                            }
                        });
                });
            });

            lotusGroup.append("circle")
                .attr("cx", lotusX)
                .attr("cy", lotusY)
                .attr("r", cWidth * 0.012 * scale)
                .attr("fill", "#f4d03f")
                .attr("stroke", "#d4ac0d")
                .attr("stroke-width", cWidth * 0.0015)
                .style("cursor", "pointer")
                .on("mouseover", function(event) {
                    d3.select(this).attr("r", cWidth * 0.014 * scale);
                    const tooltipHtml = `<h3>${context.name}</h3>
                        <p><strong>Total Sentences:</strong> ${context.count || 0}</p>
                        <p><strong>Rigveda:</strong> ${vedaCounts["Rigveda"]} sentences</p>
                        <p><strong>Yajurveda:</strong> ${vedaCounts["Yajurveda"]} sentences</p>
                        <p><strong>Samaveda:</strong> ${vedaCounts["Samaveda"]} sentences</p>
                        <p><strong>Atharvaveda:</strong> ${vedaCounts["Atharvaveda"]} sentences</p>`;
                    showTooltipAt(event, tooltipHtml);
                })
                .on("mouseout", function() {
                    d3.select(this).attr("r", cWidth * 0.012 * scale);
                    hideTooltipNow();
                })
                .on("mousemove", function(event) {
                    const tooltipHtml = `<h3>${context.name}</h3>
                        <p><strong>Total Sentences:</strong> ${context.count || 0}</p>
                        <p><strong>Rigveda:</strong> ${vedaCounts["Rigveda"]} sentences</p>
                        <p><strong>Yajurveda:</strong> ${vedaCounts["Yajurveda"]} sentences</p>
                        <p><strong>Samaveda:</strong> ${vedaCounts["Samaveda"]} sentences</p>
                        <p><strong>Atharvaveda:</strong> ${vedaCounts["Atharvaveda"]} sentences</p>`;
                    showTooltipAt(event, tooltipHtml);
                });
        });

    }).catch(error => {
        console.error("Error loading context data:", error);
        container.innerHTML = `<div style="color: red; padding: 2rem;">Error loading context data: ${error}</div>`;
    });
}
