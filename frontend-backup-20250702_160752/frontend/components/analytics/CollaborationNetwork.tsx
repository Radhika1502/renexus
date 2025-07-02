import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
}

interface Collaboration {
  source: string; // team member id
  target: string; // team member id
  weight: number; // collaboration strength (1-10)
  type: 'direct' | 'indirect'; // direct = worked together, indirect = commented/reviewed
  interactions: number; // number of interactions
}

interface CollaborationNetworkProps {
  teamMembers: TeamMember[];
  collaborationData: Collaboration[];
  width?: number;
  height?: number;
  minLinkStrength?: number; // minimum link strength to display (1-10)
  highlightDepartments?: boolean;
  title?: string;
}

/**
 * Component for visualizing team collaboration patterns as a force-directed network graph
 */
const CollaborationNetwork: React.FC<CollaborationNetworkProps> = ({
  teamMembers,
  collaborationData,
  width = 800,
  height = 600,
  minLinkStrength = 1,
  highlightDepartments = true,
  title = 'Team Collaboration Network'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [filteredCollaborations, setFilteredCollaborations] = useState<Collaboration[]>([]);
  
  // Process and filter the collaboration data
  useEffect(() => {
    const filtered = collaborationData.filter(collab => collab.weight >= minLinkStrength);
    setFilteredCollaborations(filtered);
  }, [collaborationData, minLinkStrength]);
  
  // Draw the network diagram
  useEffect(() => {
    if (!svgRef.current || !teamMembers.length || !filteredCollaborations.length) return;
    
    // Clear SVG
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Create a group for the network
    const g = svg.append("g");
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
    // Create department color scale
    const departments = Array.from(new Set(teamMembers
      .filter(m => m.department)
      .map(m => m.department)));
    
    const colorScale = d3.scaleOrdinal()
      .domain(departments as string[])
      .range(d3.schemeCategory10);
    
    // Create network nodes from team members
    const nodes = teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department || 'Unknown',
      avatar: member.avatar,
      radius: 20, // default node radius
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100
    }));
    
    // Create links from collaboration data
    const links = filteredCollaborations.map(collab => ({
      source: collab.source,
      target: collab.target,
      weight: collab.weight,
      type: collab.type,
      interactions: collab.interactions
    }));
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => 150 - (d.weight * 10)) // stronger links = shorter distance
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.radius + 10));
    
    // Create links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", (d: any) => d.weight)
      .attr("stroke", (d: any) => d.type === 'direct' ? "#999" : "#ccc")
      .attr("stroke-dasharray", (d: any) => d.type === 'direct' ? "none" : "5,5");
    
    // Create nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      )
      .on("click", (event, d: any) => {
        setSelectedMember(selectedMember === d.id ? null : d.id);
      });
    
    // Add node backgrounds (circles)
    node.append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => highlightDepartments ? colorScale(d.department) : "#69b3a2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // Add node labels (text)
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d: any) => d.name.split(' ')[0]) // Only show first name to save space
      .attr("fill", "#fff")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("pointer-events", "none");
    
    // Add title for hover tooltip
    node.append("title")
      .text((d: any) => `${d.name} (${d.role})\nDepartment: ${d.department}`);
    
    // Update positions on each simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Add a legend for departments if enabled
    if (highlightDepartments && departments.length > 0) {
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 20)`);
      
      legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Departments")
        .style("font-weight", "bold");
      
      departments.forEach((dept, i) => {
        const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20 + 20})`);
        
        legendRow.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", colorScale(dept as string));
        
        legendRow.append("text")
          .attr("x", 15)
          .attr("y", 10)
          .text(dept)
          .style("font-size", "12px");
      });
    }
    
    // Add a legend for link types
    const linkLegend = svg.append("g")
      .attr("class", "link-legend")
      .attr("transform", `translate(20, 20)`);
    
    linkLegend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Collaboration Types")
      .style("font-weight", "bold");
    
    // Direct collaboration
    linkLegend.append("line")
      .attr("x1", 0)
      .attr("y1", 20)
      .attr("x2", 30)
      .attr("y2", 20)
      .attr("stroke", "#999")
      .attr("stroke-width", 2);
    
    linkLegend.append("text")
      .attr("x", 35)
      .attr("y", 25)
      .text("Direct")
      .style("font-size", "12px");
    
    // Indirect collaboration
    linkLegend.append("line")
      .attr("x1", 0)
      .attr("y1", 40)
      .attr("x2", 30)
      .attr("y2", 40)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
    
    linkLegend.append("text")
      .attr("x", 35)
      .attr("y", 45)
      .text("Indirect")
      .style("font-size", "12px");
    
    // Update selection effect when selected member changes
    if (selectedMember) {
      // Dim all nodes and links
      node.style("opacity", 0.3);
      link.style("opacity", 0.1);
      
      // Highlight selected node and its connections
      node.filter((d: any) => d.id === selectedMember)
        .style("opacity", 1)
        .select("circle")
        .attr("stroke", "#ff0000")
        .attr("stroke-width", 3);
      
      // Find directly connected nodes
      const connectedLinks = links.filter((d: any) => 
        d.source.id === selectedMember || d.target.id === selectedMember);
      
      const connectedNodeIds = new Set();
      connectedLinks.forEach((d: any) => {
        connectedNodeIds.add(d.source.id);
        connectedNodeIds.add(d.target.id);
      });
      
      // Highlight connected nodes
      node.filter((d: any) => connectedNodeIds.has(d.id))
        .style("opacity", 1);
      
      // Highlight connected links
      link.filter((d: any) => 
        d.source.id === selectedMember || d.target.id === selectedMember)
        .style("opacity", 1)
        .attr("stroke-width", (d: any) => d.weight + 2);
    } else {
      // Reset all nodes and links
      node.style("opacity", 1)
        .select("circle")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
      
      link.style("opacity", 1)
        .attr("stroke-width", (d: any) => d.weight);
    }
    
  }, [teamMembers, filteredCollaborations, width, height, selectedMember, highlightDepartments]);
  
  // Handle network refinement controls
  const handleLinkStrengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setFilteredCollaborations(
      collaborationData.filter(collab => collab.weight >= value)
    );
  };
  
  return (
    <div className="collaboration-network" style={{ width: '100%' }}>
      <h3>{title}</h3>
      
      {teamMembers.length === 0 || collaborationData.length === 0 ? (
        <div className="no-data">No collaboration data available</div>
      ) : (
        <>
          <div className="network-controls" style={{ marginBottom: '10px' }}>
            <label>
              Minimum Link Strength:
              <input 
                type="range" 
                min={1} 
                max={10} 
                defaultValue={minLinkStrength}
                onChange={handleLinkStrengthChange}
                style={{ marginLeft: '10px', verticalAlign: 'middle' }}
              />
            </label>
            
            {selectedMember && (
              <button 
                onClick={() => setSelectedMember(null)}
                style={{ marginLeft: '20px' }}
              >
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="network-container" style={{ 
            width: '100%', 
            height: `${height}px`, 
            border: '1px solid #ddd',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <svg ref={svgRef}></svg>
          </div>
          
          {selectedMember && (
            <div className="member-details" style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px' 
            }}>
              <h4>Collaboration Details</h4>
              {(() => {
                const member = teamMembers.find(m => m.id === selectedMember);
                if (!member) return <div>No details available</div>;
                
                const connections = filteredCollaborations
                  .filter(collab => 
                    collab.source === selectedMember || collab.target === selectedMember
                  )
                  .map(collab => {
                    const isSource = collab.source === selectedMember;
                    const connectedId = isSource ? collab.target : collab.source;
                    const connectedMember = teamMembers.find(m => m.id === connectedId);
                    return {
                      member: connectedMember,
                      weight: collab.weight,
                      type: collab.type,
                      interactions: collab.interactions
                    };
                  });
                  
                return (
                  <>
                    <p>
                      <strong>{member.name}</strong> ({member.role})
                      {member.department && <span> - {member.department}</span>}
                    </p>
                    <p>Total Connections: {connections.length}</p>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Team Member</th>
                          <th style={styles.tableHeader}>Strength</th>
                          <th style={styles.tableHeader}>Type</th>
                          <th style={styles.tableHeader}>Interactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {connections.map((connection, i) => (
                          <tr key={i}>
                            <td style={styles.tableCell}>
                              {connection.member ? connection.member.name : 'Unknown'}
                            </td>
                            <td style={styles.tableCell}>
                              {Array(connection.weight).fill('★').join('')}
                            </td>
                            <td style={styles.tableCell}>
                              {connection.type === 'direct' ? 'Direct' : 'Indirect'}
                            </td>
                            <td style={styles.tableCell}>
                              {connection.interactions}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  tableHeader: {
    textAlign: 'left' as const,
    padding: '8px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f3f3f3'
  },
  tableCell: {
    padding: '8px',
    borderBottom: '1px solid #ddd'
  }
};

export default CollaborationNetwork;
