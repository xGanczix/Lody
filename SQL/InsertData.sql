insert into Towary(
    TowNazwa,
    TowCenaId)
values 
    ('Lody Rzemieślnicze',1),
    ('Kawa Mrożona',2),
    ('Granita',3),
    ('Dodatek1',4),
    ('Dodatek2',5);

insert into
	Ceny(
        CTowId,
        CCena,
        CPoprzedniaCena)
values
    (1,6.00,6.00),
    (2,8.00,8.00),
    (3,8.00,8.00),
    (4,0.5,0.5),
    (5,2.00,2.00);