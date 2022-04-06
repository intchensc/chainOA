#include<8051.h>
unsigned char i = 0;
unsigned char zheng = 1;

void main(void) {


    TH0 = 1;
    TL0 = 1;
    TMOD = 0x01;
    ET0 = 0x01;
    EA = 1;
    TR0 = 1;

    while (1) {
        if (i >= 7) zheng = 0;
        if (i <= 0) zheng = 1;
    }

}

void inter(void) __interrupt 1 {
    TH0 = 1;
    TL0 = 1;

	// ??? P0?P1?P2 ???? ?? ????
    //P0 = ~(1 << i);
    P1 = ~(1 << i);
    //P2 = ~(1 << i);
    if(zheng == 1)    {
        i++;
    }else{
        i--;
    }
}