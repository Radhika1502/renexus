import React, { useState, useEffect } from 'react';
import { 
  HeatMapGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacity: number; // hours per week
  avatar?: string;
}

interface WorkloadItem {
  memberId: string;
  category: string;
  hours: number;
  tasks: number;
}

interface WorkloadDistributionProps {
  teamMembers: TeamMember[];
  workloadData: WorkloadItem[];
  startDate: Date;
  endDate: Date;
  showCapacityIndicator?: boolean;
  title?: string;
}

/**
 * Component for visualizing team workload distribution
 */
const WorkloadDistribution: React.FC<WorkloadDistributionProps> = ({
  teamMembers,
  workloadData,
  startDate,
  endDate,
  showCapacityIndicator = true,
  title = 'Team Workload Distribution'
}) => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    if (!teamMembers.length || !workloadData.length) return;
    
    // Extract unique categories
    const uniqueCategories = Array.from(new Set(workloadData.map(item => item.category)));
    setCategories(uniqueCategories);
    
    // Process data for the heatmap
    const processedData = teamMembers.map(member => {
      const memberData: Record<string, any> = {
        name: member.name,
        id: member.id,
        role: member.role,
        capacity: member.capacity,
        totalHours: 0,
        utilization: 0
      };
      
      uniqueCategories.forEach(category => {
        const categoryItems = workloadData.filter(
          item => item.memberId === member.id && item.category === category
        );
        
        const hours = categoryItems.reduce((sum, item) => sum + item.hours, 0);
        const tasks = categoryItems.reduce((sum, item) => sum + item.tasks, 0);
        
        memberData[category] = hours;
        memberData[`${category}_tasks`] = tasks;
        memberData.totalHours += hours;
      });
      
      // Calculate utilization percentage
      const workingDays = calculateWorkingDays(startDate, endDate);
      const availableHours = (member.capacity / 5) * workingDays; // Assuming capacity is weekly and 5 working days
      memberData.utilization = Math.min(100, (memberData.totalHours / availableHours) * 100);
      
      return memberData;
    });
    
    setHeatmapData(processedData);
  }, [teamMembers, workloadData, startDate, endDate]);
  
  // Calculate the number of working days between two dates
  const calculateWorkingDays = (start: Date, end: Date): number => {
    let count = 0;
    const curDate = new Date(start.getTime());
    
    while (curDate <= end) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // Skip weekends
      curDate.setDate(curDate.getDate() + 1);
    }
    
    return count;
  };
  
  // Get color based on utilization percentage
  const getUtilizationColor = (utilization: number): string => {
    if (utilization < 70) return '#4CAF50'; // Under-allocated (green)
    if (utilization <= 100) return '#FFC107'; // Well-allocated (yellow)
    return '#F44336'; // Over-allocated (red)
  };
  
  // Since recharts doesn't have HeatMapGrid, we'll create our own heatmap using a table
  return (
    <div className="workload-distribution" style={{ width: '100%' }}>
      <h3>{title}</h3>
      
      {heatmapData.length === 0 ? (
        <div className="no-data">No workload data available</div>
      ) : (
        <div className="heatmap-container" style={{ overflowX: 'auto' }}>
          <table className="heatmap-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.headerCell}>Team Member</th>
                {categories.map(category => (
                  <th key={category} style={styles.headerCell}>{category}</th>
                ))}
                <th style={styles.headerCell}>Total Hours</th>
                {showCapacityIndicator && (
                  <th style={styles.headerCell}>Utilization</th>
                )}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((member) => {
                const isSelected = selectedMember === member.id;
                const utilizationColor = getUtilizationColor(member.utilization);
                
                return (
                  <tr 
                    key={member.id}
                    onClick={() => setSelectedMember(isSelected ? null : member.id)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0f0f0' : 'transparent' 
                    }}
                  >
                    <td style={styles.memberCell}>
                      <div style={styles.memberInfo}>
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name} 
                            style={styles.avatar} 
                          />
                        ) : (
                          <div style={{
                            ...styles.avatar,
                            backgroundColor: '#e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#555'
                          }}>
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                          <div style={{ fontSize: '0.8em', color: '#666' }}>{member.role}</div>
                        </div>
                      </div>
                    </td>
                    
                    {categories.map(category => {
                      const hours = member[category] || 0;
                      const intensity = Math.min(1, hours / (member.capacity / categories.length));
                      
                      return (
                        <td 
                          key={`${member.id}-${category}`}
                          style={{
                            ...styles.dataCell,
                            backgroundColor: `rgba(72, 133, 237, ${intensity.toFixed(2)})`
                          }}
                          title={`${hours} hours on ${category} tasks`}
                        >
                          <div>
                            <div>{hours.toFixed(1)}</div>
                            <div style={{ fontSize: '0.75em' }}>
                              {member[`${category}_tasks`] || 0} tasks
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    
                    <td style={styles.totalCell}>
                      {member.totalHours.toFixed(1)}h
                    </td>
                    
                    {showCapacityIndicator && (
                      <td style={styles.utilizationCell}>
                        <div style={styles.utilizationBar}>
                          <div 
                            style={{
                              ...styles.utilizationFill,
                              width: `${Math.min(100, member.utilization)}%`,
                              backgroundColor: utilizationColor
                            }}
                          ></div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '3px' }}>
                          {member.utilization.toFixed(0)}%
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="heatmap-legend" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="workload-scale" style={{ display: 'flex', alignItems: 'center' }}>
          <span>Workload: </span>
          <div style={{
            display: 'flex',
            marginLeft: '10px',
            height: '20px',
            width: '200px',
            background: 'linear-gradient(to right, rgba(72, 133, 237, 0), rgba(72, 133, 237, 1))'
          }}></div>
          <span style={{ marginLeft: '5px' }}>Low to High</span>
        </div>
        
        {showCapacityIndicator && (
          <div className="utilization-legend" style={{ display: 'flex', alignItems: 'center' }}>
            <span>Utilization: </span>
            <div style={{ display: 'flex', marginLeft: '10px', alignItems: 'center' }}>
              <div style={{ ...styles.legendItem, backgroundColor: '#4CAF50' }}></div>
              <span>&lt;70%</span>
            </div>
            <div style={{ display: 'flex', marginLeft: '10px', alignItems: 'center' }}>
              <div style={{ ...styles.legendItem, backgroundColor: '#FFC107' }}></div>
              <span>70-100%</span>
            </div>
            <div style={{ display: 'flex', marginLeft: '10px', alignItems: 'center' }}>
              <div style={{ ...styles.legendItem, backgroundColor: '#F44336' }}></div>
              <span>&gt;100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  headerCell: {
    padding: '10px',
    textAlign: 'left' as const,
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa'
  },
  memberCell: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
    whiteSpace: 'nowrap' as const
  },
  memberInfo: {
    display: 'flex' as const,
    alignItems: 'center' as const
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    marginRight: '10px',
    overflow: 'hidden' as const
  },
  dataCell: {
    padding: '10px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #ddd'
  },
  totalCell: {
    padding: '10px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    borderBottom: '1px solid #ddd'
  },
  utilizationCell: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
    width: '100px'
  },
  utilizationBar: {
    height: '10px',
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    overflow: 'hidden' as const
  },
  utilizationFill: {
    height: '100%',
  },
  legendItem: {
    width: '15px',
    height: '15px',
    marginRight: '5px',
    borderRadius: '2px'
  }
};

export default WorkloadDistribution;
