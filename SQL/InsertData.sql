insert into Towary(
    TowNazwa,
    TowCenaId)
values 
    ('Lody Rzemieślnicze',1),
    ('Lody Włoskie Małe',2),
    ('Lody Włoskie Duże',3),
    ('Kawa Mrożona',4),
    ('Granita',5),
    ('Polewa/Posypka',6),
    ('Bita Śmietana',7);

insert into
	Ceny(
        CTowId,
        CCena,
        CPoprzedniaCena)
values
    (1,0,0),
    (2,0,0),
    (3,0,0),
    (4,0,0),
    (5,0,0),
    (6,0,0),
    (7,0,0);

insert into
    DokumentyTyp(
        DokTypNazwa,
        DokTypSymbol)
values
    ("Wydanie Zewnętrzne","WZ"),
    ("Zamówienie","ZAM");