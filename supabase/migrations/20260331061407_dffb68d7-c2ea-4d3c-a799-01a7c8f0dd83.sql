
-- Seed tender and board result sources into scraping_sources
INSERT INTO public.scraping_sources (type, name, url, scraping_frequency, notes) VALUES
('tender', 'PPRA Federal', 'https://www.ppra.org.pk/tenders.asp', 'daily', 'Federal procurement authority - highest volume'),
('tender', 'PPRA Sindh', 'https://www.pprasindh.gov.pk/', 'daily', 'Sindh provincial tenders'),
('tender', 'PPRA Punjab', 'https://ppra.punjab.gov.pk/', 'daily', 'Punjab provincial tenders'),
('tender', 'WAPDA Tenders', 'https://www.wapda.gov.pk/index.php/tenders', 'weekly', 'Water and Power Development Authority'),
('tender', 'SNGPL Tenders', 'https://www.sngpl.com.pk/tenders/', 'weekly', 'Sui Northern Gas'),
('tender', 'Pakistan Railways', 'http://www.railways.gov.pk/Tenders.aspx', 'weekly', 'PR tenders and contracts'),
('board_result', 'BISE Karachi', 'http://www.biek.edu.pk/', 'on_demand', 'Karachi board - SSC/HSC results'),
('board_result', 'BISE Hyderabad', 'http://www.biseh.edu.pk/', 'on_demand', 'Hyderabad board results'),
('board_result', 'BISE Sukkur', 'http://www.bises.edu.pk/', 'on_demand', 'Sukkur board results'),
('board_result', 'BISE Larkana', 'http://www.biselarkana.edu.pk/', 'on_demand', 'Larkana board results'),
('board_result', 'BISE Lahore', 'https://www.biselahore.com/', 'on_demand', 'Lahore board - largest in Punjab'),
('board_result', 'FBISE', 'https://www.fbise.edu.pk/', 'on_demand', 'Federal Board Islamabad')
ON CONFLICT (url) DO NOTHING;
