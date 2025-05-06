sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/HTML",
    "sap/ui/model/json/JSONModel"
  ], function (Control, Controller, HTML, JSONModel) {
    "use strict";
  
    // Sankey Control Definition
    return Control.extend("postmigrationtestingtool.control.SankeyControl", {
        metadata: {
            properties: {
                data: { type: "object", defaultValue: null },
                width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },
                height: { type: "sap.ui.core.CSSSize", defaultValue: "400px" }
            }
        },
  
        // Render Sankey diagram on after rendering
        onAfterRendering: function () {
            this._renderSankey();
        },
  
        // Render Sankey diagram
        _renderSankey: function () {
            const data = this.getData();
            if (!data) {
                console.warn("No data available for Sankey diagram.");
                return;
            }
  
            const container = this.getDomRef();
            container.innerHTML = ""; // Clear previous content
  
            const width = parseInt(this.getWidth(), 10) || 700;
            const height = parseInt(this.getHeight(), 10) || 400;
  
            // Create SVG container
            const svg = d3.select(container)
                .append("svg")
                .attr("width", width)
                .attr("height", height);
  
            // Define Sankey layout
            const sankey = d3.sankey()
                .size([width, height])
                .nodeWidth(18)
                .nodePadding(290);
  
            // Load the data from model
            const graph = data;
  
            // Define color scale
            const color = d3.scaleOrdinal()
                .domain(graph.nodes.map(d => d.name)) 
                .range(d3.schemeCategory10); // Example color scheme
  
            // Constructs a new Sankey generator with the default settings.
            sankey
                .nodes(graph.nodes)
                .links(graph.links)
                .layout(1);
  
            // Add links
            const link = svg.append("g")
                .selectAll(".link")
                .data(graph.links)
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("d", sankey.link())
                .style("stroke-width", d => Math.max(1, d.dy))
                .sort(function(a, b) { return b.dy - a.dy; });
  
            // Add nodes
            const node = svg.append("g")
                .selectAll(".node")
                .data(graph.nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .call(d3.drag()
                    .subject(function(d) { return d; })
                    .on("start", function() { this.parentNode.appendChild(this); })
                    .on("drag", dragmove));
  
            // Add rectangles for nodes
            node.append("rect")
                .attr("height", function(d) { return d.dy; })
                .attr("width", sankey.nodeWidth())
                .style("fill", function(d) { return color(d.name); })
                .style("stroke", function(d) { return d3.rgb(color(d.name)).darker(2); })
                .append("title")
                .text(function(d) { return d.name + "\n" + "There is " + d.value + " stuff in this node"; });
  
            // Add node labels
            node.append("text")
                .attr("x", -6)
                .attr("y", function(d) { return d.dy / 2; })
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .attr("transform", null)
                .text(function(d) { return d.name; })
                .filter(function(d) { return d.x < width / 2; })
                .attr("x", 6 + sankey.nodeWidth())
                .attr("text-anchor", "start");
  
            // Function for moving nodes
            function dragmove(d) {
                d3.select(this)
                    .attr("transform",
                        "translate("
                            + d.x + ","
                            + (d.y = Math.max(
                                0, Math.min(height - d.dy, d3.event.y))
                            ) + ")");
                sankey.relayout();
                link.attr("d", sankey.link());
            }
        }
    });
  });