import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { importDataFromJson } from "@/utils/importData";
import { EditCollectorDialog } from "@/components/collectors/EditCollectorDialog";
import { CollectorList } from "@/components/collectors/CollectorList";

export default function Collectors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);
  const [editingCollector, setEditingCollector] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const { data: collectors, isLoading, refetch } = useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select(`
          *,
          members:members(*)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const toggleCollector = (collectorId: string) => {
    setExpandedCollector(expandedCollector === collectorId ? null : collectorId);
  };

  const handleImportData = async () => {
    const result = await importDataFromJson();
    if (result.success) {
      toast({
        title: "Data imported successfully",
        description: "The collectors and members data has been imported.",
      });
    } else {
      toast({
        title: "Import failed",
        description: "There was an error importing the data.",
        variant: "destructive",
      });
    }
  };

  const handlePrintAll = () => {
    const printContent = `
      <html>
        <head>
          <title>All Collectors Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .collector-section { margin-bottom: 30px; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>All Collectors Report</h1>
          ${collectors?.map(collector => `
            <div class="collector-section">
              <h2>Collector: ${collector.name}</h2>
              <p>ID: ${collector.prefix}${collector.number}</p>
              <p>Status: ${collector.active ? 'Active' : 'Inactive'}</p>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Member ID</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  ${collector.members?.map(member => `
                    <tr>
                      <td>${member.full_name}</td>
                      <td>${member.member_number}</td>
                      <td>${member.email || '-'}</td>
                      <td>${member.phone || '-'}</td>
                      <td>${member.address || '-'}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="5">No members found</td></tr>'}
                </tbody>
              </table>
            </div>
          `).join('') || '<p>No collectors found</p>'}
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-4xl font-bold text-white">
          Collectors Management
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleImportData()}
          >
            <UserPlus className="h-4 w-4" />
            Import Data
          </Button>
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="h-4 w-4" />
            Add New Collector
          </Button>
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handlePrintAll}
          >
            <Printer className="h-4 w-4" />
            Print All Collectors
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by collector name or number..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <CollectorList
        collectors={collectors || []}
        expandedCollector={expandedCollector}
        onToggleCollector={toggleCollector}
        onEditCollector={setEditingCollector}
        onUpdate={refetch}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />

      {editingCollector && (
        <EditCollectorDialog
          isOpen={true}
          onClose={() => setEditingCollector(null)}
          collector={editingCollector}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}