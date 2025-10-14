import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LeadsPanel = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Leads</CardTitle>
          <CardDescription>
            Adicione, visualize e gerencie todos os leads da sua unidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>A tabela de leads e as funcionalidades de gerenciamento serão implementadas aqui em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const Leads = () => <LeadsPanel />;

export default Leads;