"use client";

import { useState } from "react";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import {
  ImagePlaceholder,
  MyceliumPattern,
  BananaLeafLines,
  SoyDots,
} from "@/components/brand/textures";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, SlotBadge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

function Demo({ mode }: { mode: "light" | "dark" }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <div
      className={cn(
        mode,
        "flex flex-col gap-8 rounded-lg border bg-background p-6 text-foreground",
      )}
    >
      <p className="font-display text-h4">
        {mode === "light" ? "Light" : "Dark"}
      </p>

      <Group title="Button variants">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
        <Button disabled>Disabled</Button>
        <Button asChild variant="secondary">
          <a href="#components">asChild link</a>
        </Button>
      </Group>
      <Group title="Button sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Tambah">
          <PlusIcon />
        </Button>
      </Group>

      <Group title="Badge">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="halal">Halal BPJPH</Badge>
        <SlotBadge status="available" />
        <SlotBadge status="nearly" />
        <SlotBadge status="full" />
        <SlotBadge status="closed" />
      </Group>

      <Group title="Form">
        <div className="grid w-full max-w-sm gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`name-${mode}`}>Nama</Label>
            <Input id={`name-${mode}`} placeholder="Nama pemesan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`note-${mode}`}>Catatan</Label>
            <Textarea id={`note-${mode}`} placeholder="Bentuk, ukuran, dll." />
          </div>
          <div className="grid gap-1.5">
            <Label>Varian</Label>
            <Select defaultValue="klasik">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="klasik">Tempe Klasik</SelectItem>
                <SelectItem value="original">Tempe Original</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`cb-${mode}`} defaultChecked />
            <Label htmlFor={`cb-${mode}`}>Kirim ke alamat</Label>
          </div>
          <RadioGroup defaultValue="a">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="a" id={`ra-${mode}`} />
              <Label htmlFor={`ra-${mode}`}>Ambil sendiri</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="b" id={`rb-${mode}`} />
              <Label htmlFor={`rb-${mode}`}>Diantar</Label>
            </div>
          </RadioGroup>
          <div className="flex items-center gap-2">
            <Switch id={`sw-${mode}`} />
            <Label htmlFor={`sw-${mode}`}>Buka PO</Label>
          </div>
        </div>
      </Group>

      <Group title="Overlays">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi pesanan</DialogTitle>
              <DialogDescription>Cek lagi sebelum dikirim.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>Kirim</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Navigasi mobile.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Alert dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus permanen?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batalkan</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Popover</Button>
          </PopoverTrigger>
          <PopoverContent>Isi popover.</PopoverContent>
        </Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Masih ada 4 slot</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Menu <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Akun</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="accent" onClick={() => toast.success("Tersimpan.")}>
          Toast
        </Button>
      </Group>

      <Group title="Accordion / Tabs">
        <Accordion type="single" collapsible className="w-full max-w-md">
          <AccordionItem value="1">
            <AccordionTrigger>Apa saja bahannya?</AccordionTrigger>
            <AccordionContent>Kedelai, air, dan ragi.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Berapa lama fermentasi?</AccordionTrigger>
            <AccordionContent>Sekitar dua hari.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Tabs defaultValue="a" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="a">Klasik</TabsTrigger>
            <TabsTrigger value="b">Original</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Dengan kulit ari.</TabsContent>
          <TabsContent value="b">Tanpa kulit ari.</TabsContent>
        </Tabs>
      </Group>

      <Group title="Card / Alert / Avatar / Skeleton / Separator">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Tempe Klasik</CardTitle>
            <CardDescription>Padat, dengan kulit ari.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImagePlaceholder caption="tekstur Tempe Klasik" aspect="16 / 9" />
          </CardContent>
          <CardFooter>
            <Button size="sm">Pilih varian ini</Button>
          </CardFooter>
        </Card>
        <Alert className="max-w-sm">
          <AlertTitle>Slot hampir penuh</AlertTitle>
          <AlertDescription>Tinggal 2 slot untuk besok.</AlertDescription>
        </Alert>
        <Avatar>
          <AvatarFallback>MN</AvatarFallback>
        </Avatar>
        <Skeleton className="h-10 w-40" />
        <Separator className="w-full" />
      </Group>

      <Group title="Calendar / Command / Breadcrumb / Nav">
        <Calendar mode="single" selected={date} onSelect={setDate} />
        <Command className="max-w-xs rounded-lg border">
          <CommandInput placeholder="Cari..." />
          <CommandList>
            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
            <CommandItem>
              <SearchIcon /> Tempe Klasik
            </CommandItem>
            <CommandItem>Tempe Original</CommandItem>
          </CommandList>
        </Command>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Beranda</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Produk</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className={navigationMenuTriggerStyle()}
              >
                Produk
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className={navigationMenuTriggerStyle()}
              >
                Cara pesan
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Group>

      <Group title="Table / ScrollArea">
        <Table className="max-w-md">
          <TableHeader>
            <TableRow>
              <TableHead>Varian</TableHead>
              <TableHead>Kulit ari</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Klasik</TableCell>
              <TableCell>Ya</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Original</TableCell>
              <TableCell>Dikupas</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <ScrollArea className="h-24 w-48 rounded-md border p-3 text-small">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>Baris {i + 1}</p>
          ))}
        </ScrollArea>
      </Group>

      <Group title="Textures (P2.5)">
        <div className="relative h-32 w-48 overflow-hidden rounded-md border bg-surface text-primary">
          <MyceliumPattern className="opacity-20" />
        </div>
        <div className="relative h-32 w-48 overflow-hidden rounded-md border bg-surface text-primary">
          <BananaLeafLines className="opacity-20" />
        </div>
        <div className="relative h-32 w-48 overflow-hidden rounded-md border bg-surface">
          <SoyDots className="size-full text-accent opacity-30" />
        </div>
        <div className="w-48">
          <ImagePlaceholder caption="proses membungkus" texture="leaf" />
        </div>
        <div className="w-48">
          <ImagePlaceholder caption="kedelai pilihan" texture="soy" />
        </div>
      </Group>
    </div>
  );
}

export function ComponentsDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo mode="light" />
      <Demo mode="dark" />
      <Toaster />
    </div>
  );
}
